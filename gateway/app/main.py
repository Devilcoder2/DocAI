import logging
from fastapi import FastAPI, Request, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import httpx
import jwt
from app.config import settings
from app.middleware.auth import AuthMiddleware
from app.middleware.audit import AuditMiddleware

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("gateway.main")

# Global AsyncClient to pool connections for downstream proxying
http_client = httpx.AsyncClient(timeout=10.0)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: setup resources
    yield
    # Shutdown: release resources
    await http_client.aclose()

app = FastAPI(
    title="Medical AI Platform Gateway",
    description="Central routing, security, and auditing entry point.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware Configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register security and logging middlewares
# AuthMiddleware runs inside AuditMiddleware
app.add_middleware(AuthMiddleware)
app.add_middleware(AuditMiddleware)


async def proxy_request(method: str, path: str, request: Request, headers: dict = None, json_body: dict = None, params: dict = None, service_url: str = settings.SERVICE_SCHEDULING_URL):
    """
    Helper function that proxies request HTTP methods to the specified microservice.

    Inputs:
        method (str): GET, POST, PUT, DELETE.
        path (str): Endpoint path on the microservice.
        request (Request): Original FastAPI request context.
        headers (dict, optional): Custom headers to merge.
        json_body (dict, optional): Payload for POST/PUT.
        params (dict, optional): Query parameters.
        service_url (str): Downstream service base URL.

    Outputs:
        JSONResponse: Proxy HTTP response container.
    """
    url = f"{service_url}{path}"
    
    req_headers = {}
    if headers:
        req_headers.update(headers)
        
    req_params = dict(request.query_params)
    if params:
        req_params.update(params)
        
    try:
        if method == "GET":
            response = await http_client.get(url, headers=req_headers, params=req_params)
        elif method == "POST":
            response = await http_client.post(url, headers=req_headers, params=req_params, json=json_body)
        elif method == "PUT":
            response = await http_client.put(url, headers=req_headers, params=req_params, json=json_body)
        elif method == "DELETE":
            response = await http_client.delete(url, headers=req_headers, params=req_params)
        else:
            raise HTTPException(status_code=500, detail="Unsupported proxy method")
            
        # Parse output body if status is not NO_CONTENT
        if response.status_code == 204:
            from fastapi import Response
            return Response(status_code=204)
            
        try:
            res_content = response.json()
        except ValueError:
            res_content = {"detail": response.text}
            
        return JSONResponse(status_code=response.status_code, content=res_content)
        
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Downstream service at {url} is currently unavailable: {str(exc)}"
        )


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/api/v1/public/test")
def public_test():
    return {
        "message": "This is a public endpoint.",
        "user_id": None,
        "role": "Guest"
    }


@app.get("/api/v1/protected-test")
def protected_test(request: Request):
    return {
        "message": "This is a secure protected endpoint.",
        "user_id": request.state.user_id,
        "role": request.state.role
    }


# ==========================================
# PUBLIC PROVIDER DISCOVERY & AVAILABILITY PROXIES
# ==========================================

@app.get("/api/v1/public/doctors")
async def public_list_doctors(request: Request):
    """
    Proxies provider search requests.
    """
    return await proxy_request("GET", "/doctors", request)


@app.get("/api/v1/public/doctors/{id}/availability")
async def public_get_availability(id: str, request: Request):
    """
    Proxies doctor availability queries.
    """
    return await proxy_request("GET", f"/doctors/{id}/availability", request)


# ==========================================
# PUBLIC SIMULATION AUTHENTICATION ROUTERS
# ==========================================

@app.post("/api/v1/public/auth/register")
async def auth_register(request: Request):
    """
    Signs up a new guest user profile and issues a valid JWT credential token.
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request JSON payload.")

    # Create the user downstream in the scheduling database
    response = await proxy_request("POST", "/users", request, json_body=body)
    if response.status_code != 201:
        return response

    import json
    user_json = json.loads(response.body.decode("utf-8"))
    
    # Sign JWT token using local settings
    payload = {
        "user_id": user_json["id"],
        "role": user_json["role"]
    }
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return {"token": token, "user": user_json}


@app.post("/api/v1/public/auth/login")
async def auth_login(request: Request):
    """
    Authenticates a user via email & password, or by email alone (for simulated SSO/legacy scripts).
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request JSON payload.")

    email = body.get("email")
    password = body.get("password")
    if not email:
        raise HTTPException(status_code=400, detail="Email parameter is required.")

    import json
    if password:
        # Verify credentials downstream in scheduling service
        response = await proxy_request("POST", "/users/verify-password", request, json_body={"email": email, "password": password})
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Incorrect email or password.")
        res_data = json.loads(response.body.decode("utf-8"))
        user_json = res_data["user"]
    else:
        # Simulated SSO or legacy email lookup
        response = await proxy_request("GET", "/users/by-email", request, params={"email": email})
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="User account not found with this email.")
        user_json = json.loads(response.body.decode("utf-8"))
    
    # Sign JWT token using local settings
    payload = {
        "user_id": user_json["id"],
        "role": user_json["role"]
    }
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return {"token": token, "user": user_json}


# ==========================================
# PROTECTED PROFILE CRUD PROXIES
# ==========================================

@app.get("/api/v1/users/me")
async def get_me(request: Request):
    """
    Fetches the profile details of the currently logged-in user.
    """
    user_id = request.state.user_id
    return await proxy_request("GET", f"/users/{user_id}", request)


@app.put("/api/v1/users/me")
async def update_me(request: Request):
    """
    Updates the profile details of the currently logged-in user.
    """
    user_id = request.state.user_id
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body.")
    return await proxy_request("PUT", f"/users/{user_id}", request, json_body=body)


@app.delete("/api/v1/users/me")
async def delete_me(request: Request):
    """
    Deletes the account of the currently logged-in user.
    """
    user_id = request.state.user_id
    return await proxy_request("DELETE", f"/users/{user_id}", request)


@app.get("/api/v1/users/{id}")
async def get_user_profile(id: str, request: Request):
    """
    Retrieves a user profile by ID. Enforces role gating: only Doctors or self can view.
    """
    user_role = request.state.role
    user_id = request.state.user_id
    if user_role != "Doctor" and str(user_id) != id:
        raise HTTPException(status_code=403, detail="Unauthorized access to patient record.")
    return await proxy_request("GET", f"/users/{id}", request)


@app.get("/api/v1/public/doctors/{id}")
async def public_get_doctor_profile(id: str, request: Request):
    """
    Exposes doctor profiles publicly so provider page details can render.
    """
    return await proxy_request("GET", f"/doctors/{id}", request)


@app.put("/api/v1/doctors/{id}")
async def update_doctor_profile(id: str, request: Request):
    """
    Updates a doctor's details (admin or doctor role restriction can be layered).
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body.")
    return await proxy_request("PUT", f"/doctors/{id}", request, json_body=body)


# ==========================================
# PROTECTED APPOINTMENTS & SCHEDULING PROXIES
# ==========================================

@app.post("/api/v1/appointments")
async def book_appointment(request: Request):
    """
    Forwards appointment reservations, injecting the verified JWT user_id.
    """
    user_id = request.state.user_id
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body.")

    headers = {"X-User-Id": str(user_id)}
    return await proxy_request("POST", "/appointments", request, headers=headers, json_body=body)


@app.get("/api/v1/appointments")
async def list_appointments(request: Request):
    """
    Proxies request to list appointments with filters.

    Inputs:
        request (Request): Original FastAPI request context containing query parameters.

    Outputs:
        JSONResponse: Proxy HTTP response containing list of appointments.
    """
    return await proxy_request("GET", "/appointments", request)


@app.get("/api/v1/appointments/{id}")
async def fetch_appointment(id: str, request: Request):
    """
    Forwards requests for individual appointment details.
    """
    user_id = request.state.user_id
    headers = {"X-User-Id": str(user_id)}
    return await proxy_request("GET", f"/appointments/{id}", request, headers=headers)


@app.get("/api/v1/appointments/{id}/clinical-note")
async def get_clinical_note(id: str, request: Request):
    """
    Proxies request to retrieve the clinical note draft or approved record for an appointment.

    Inputs:
        id (str): Appointment UUID path parameter.
        request (Request): Original FastAPI request context.

    Outputs:
        JSONResponse: Proxy HTTP response containing clinical note details.
    """
    return await proxy_request("GET", f"/appointments/{id}/clinical-note", request)


@app.put("/api/v1/appointments/{id}/clinical-note")
async def update_clinical_note(id: str, request: Request):
    """
    Updates the clinical note draft text fields. Restricted to clinicians.

    Inputs:
        id (str): Appointment UUID path parameter.
        request (Request): Original FastAPI request containing updated clinical note body.

    Outputs:
        JSONResponse: Proxy HTTP response containing updated clinical note.
    """
    if request.state.role != "Doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Clinician role required to edit notes."
        )
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body.")
    return await proxy_request("PUT", f"/appointments/{id}/clinical-note", request, json_body=body)


@app.post("/api/v1/appointments/{id}/clinical-note/approve")
async def approve_clinical_note(id: str, request: Request):
    """
    Signs and locks the clinical note, changing appointment status to completed. Restricted to clinicians.

    Inputs:
        id (str): Appointment UUID path parameter.
        request (Request): Original FastAPI request context.

    Outputs:
        JSONResponse: Proxy HTTP response containing locked clinical note.
    """
    if request.state.role != "Doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Clinician role required to approve notes."
        )
    return await proxy_request("POST", f"/appointments/{id}/clinical-note/approve", request)



# ==========================================
# PROTECTED TELEHEALTH & WEBRTC PROXIES
# ==========================================

@app.post("/api/v1/telehealth/rooms/token")
async def proxy_telehealth_token(request: Request):
    """
    Retrieves a WebRTC LiveKit token for the room, verifying user authorization.
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body.")
    
    auth_header = request.headers.get("Authorization")
    headers = {}
    if auth_header:
        headers["Authorization"] = auth_header

    return await proxy_request(
        "POST", "/rooms/token", request,
        headers=headers, json_body=body,
        service_url=settings.SERVICE_TELEHEALTH_URL
    )


@app.get("/api/v1/telehealth/rooms/voice-token")
async def proxy_telehealth_voice_token(request: Request):
    """
    Retrieves a WebRTC LiveKit token for the conversational voice agent room.
    """
    auth_header = request.headers.get("Authorization")
    headers = {}
    if auth_header:
        headers["Authorization"] = auth_header

    return await proxy_request(
        "GET", "/rooms/voice-token", request,
        headers=headers,
        service_url=settings.SERVICE_TELEHEALTH_URL
    )


@app.post("/api/v1/telehealth/rooms/{room_name}/scribe/start")
async def proxy_scribe_start(room_name: str, request: Request):
    """
    Triggers transcription recording start for a clinical consult room.
    """
    auth_header = request.headers.get("Authorization")
    headers = {}
    if auth_header:
        headers["Authorization"] = auth_header

    return await proxy_request(
        "POST", f"/rooms/{room_name}/scribe/start", request,
        headers=headers,
        service_url=settings.SERVICE_TELEHEALTH_URL
    )


@app.post("/api/v1/telehealth/rooms/{room_name}/scribe/stop")
async def proxy_scribe_stop(room_name: str, request: Request):
    """
    Triggers transcription recording stop for a clinical consult room.
    """
    auth_header = request.headers.get("Authorization")
    headers = {}
    if auth_header:
        headers["Authorization"] = auth_header

    return await proxy_request(
        "POST", f"/rooms/{room_name}/scribe/stop", request,
        headers=headers,
        service_url=settings.SERVICE_TELEHEALTH_URL
    )


@app.get("/api/v1/telehealth/rooms/{room_name}/scribe/status")
async def proxy_scribe_status(room_name: str, request: Request):
    """
    Queries active recording status of the AI Scribe bot for a room.
    """
    auth_header = request.headers.get("Authorization")
    headers = {}
    if auth_header:
        headers["Authorization"] = auth_header

    return await proxy_request(
        "GET", f"/rooms/{room_name}/scribe/status", request,
        headers=headers,
        service_url=settings.SERVICE_TELEHEALTH_URL
    )


# ==========================================
# PUBLIC WEBHOOK PROXIES
# ==========================================

@app.post("/api/v1/agent/chat")
async def proxy_agent_chat(request: Request):
    """
    Proxies chat interaction queries to the Conversational Agent Engine.
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body.")
        
    auth_header = request.headers.get("Authorization")
    headers = {}
    if auth_header:
        headers["Authorization"] = auth_header

    return await proxy_request(
        "POST", "/api/v1/agent/chat", request,
        headers=headers, json_body=body,
        service_url=settings.SERVICE_SCRIBE_URL
    )

@app.post("/api/v1/public/telehealth/webhooks/livekit")
async def proxy_livekit_webhook(request: Request):
    """
    Exposes unprotected webhook proxy for LiveKit server notifications.
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body.")

    return await proxy_request(
        "POST", "/webhooks/livekit", request,
        json_body=body,
        service_url=settings.SERVICE_TELEHEALTH_URL
    )


@app.websocket("/api/v1/appointments/{id}/companion/chat")
async def gateway_companion_chat_websocket(id: str, websocket: WebSocket):
    """
    WebSocket proxy endpoint routing Care Companion chat frames securely to Scribe service on port 8003.
    """
    await websocket.accept()
    logger.info(f"[*] Gateway received Care Companion WebSocket connection for appointment: {id}")
    
    import websockets
    import json
    import asyncio
    
    downstream_ws_url = settings.SERVICE_SCRIBE_URL.replace("http://", "ws://").replace("https://", "wss://") + "/companion"
    logger.info(f"[*] Proxying WebSocket connection downstream to: {downstream_ws_url}")
    
    try:
        async with websockets.connect(downstream_ws_url) as downstream_ws:
            # Initialize connection downstream
            await downstream_ws.send(json.dumps({"appointment_id": id}))
            
            # Read first connection acknowledgment
            downstream_init = await downstream_ws.recv()
            await websocket.send_text(downstream_init)
            
            async def forward_to_downstream():
                try:
                    while True:
                        client_msg = await websocket.receive_text()
                        await downstream_ws.send(client_msg)
                except Exception:
                    pass

            async def forward_to_client():
                try:
                    while True:
                        server_msg = await downstream_ws.recv()
                        await websocket.send_text(server_msg)
                except Exception:
                    pass

            await asyncio.gather(forward_to_downstream(), forward_to_client())
            
    except WebSocketDisconnect:
        logger.info(f"[*] Gateway WebSocket disconnect for appointment: {id}")
    except Exception as e:
        logger.error(f"[-] Gateway WebSocket proxy error: {e}")
        try:
            await websocket.close()
        except Exception:
            pass


@app.post("/api/v1/public/booking/twilio")
async def proxy_twilio_webhook(request: Request):
    """
    Public proxy forwarding Twilio webhook Form data and returning XML TwiML content.
    """
    form_data = await request.form()
    form_dict = {key: value for key, value in form_data.items()}
    
    is_voice = request.query_params.get("is_voice", "false").lower() == "true"
    
    url = f"{settings.SERVICE_SCRIBE_URL}/booking/twilio"
    params = {"is_voice": "true" if is_voice else "false"}
    
    try:
        response = await http_client.post(url, data=form_dict, params=params)
        from fastapi import Response
        return Response(
            content=response.text,
            media_type="application/xml",
            status_code=response.status_code
        )
    except Exception as e:
        logger.error(f"[-] Gateway failed to proxy Twilio request to Scribe: {e}")
        twiml_fallback = (
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
            "<Response>\n"
            "    <Message>The clinic booking system is temporarily offline. Please call the front desk directly.</Message>\n"
            "</Response>"
        )
        from fastapi import Response
        return Response(content=twiml_fallback, media_type="application/xml", status_code=200)


