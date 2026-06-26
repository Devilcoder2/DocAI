from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import httpx
import jwt
from app.config import settings
from app.middleware.auth import AuthMiddleware
from app.middleware.audit import AuditMiddleware

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
    Simulates logging in by email to check user presence and issue a JWT.
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request JSON payload.")

    email = body.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email parameter is required.")

    # Look up user dynamically by email
    response = await proxy_request("GET", "/users/by-email", request, params={"email": email})
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="User account not found with this email.")

    import json
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


@app.get("/api/v1/appointments/{id}")
async def fetch_appointment(id: str, request: Request):
    """
    Forwards requests for individual appointment details.
    """
    user_id = request.state.user_id
    headers = {"X-User-Id": str(user_id)}
    return await proxy_request("GET", f"/appointments/{id}", request, headers=headers)


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

