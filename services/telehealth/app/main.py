import os
import time
import uuid
import httpx
import jwt
from typing import Optional, Dict
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, Header, status, BackgroundTasks
from pydantic import BaseModel, Field

from app.config import settings

# Attempt to import docker SDK. If Docker is not available on the host system,
# we fallback gracefully to simulated/mock recording tasks.
try:
    import docker
    docker_client = docker.from_env()
    # Ping Docker daemon to ensure it is actually running/reachable
    docker_client.ping()
except Exception as e:
    docker_client = None
    print(f"[*] Docker SDK not active or Daemon unreachable ({e}). Recorder will run in Mock Simulator mode.")

app = FastAPI(
    title="Telehealth & WebRTC Session Microservice",
    description="Microservice managing LiveKit SFU room credentials, transcription recordings, and bot lifecycle tasks.",
    version="1.0.0"
)

# Global in-memory dictionary tracking active scribes for telehealth rooms
# Structure: { room_name: { "container_id": Optional[str], "is_mock": bool, "start_time": float, "appointment_id": str } }
active_scribes: Dict[str, dict] = {}


# ==========================================
# PYDANTIC MODEL SCHEMAS
# ==========================================

class TokenRequest(BaseModel):
    """
    Request model for generating a LiveKit WebRTC room token.
    """
    appointment_id: uuid.UUID = Field(..., description="UUID of the appointment to join.")


class TokenResponse(BaseModel):
    """
    Response model containing room access credentials.
    """
    token: str = Field(..., description="Signed LiveKit JWT access token.")
    room_name: str = Field(..., description="Unique name of the LiveKit WebRTC room.")
    identity: str = Field(..., description="Participant identity key.")
    name: str = Field(..., description="User display name.")


class ScribeStartResponse(BaseModel):
    """
    Response details after requesting to start recording.
    """
    status: str = Field(..., description="Status of the scribe bot (e.g. RECORDING, MOCK_ACTIVE).")
    room_name: str = Field(..., description="Name of the room being recorded.")
    container_id: Optional[str] = Field(None, description="Docker container ID if spawned.")


class ScribeStatusResponse(BaseModel):
    """
    Status of the recording bot for a specific room.
    """
    status: str = Field(..., description="Current state: STANDBY, RECORDING, MOCK_ACTIVE, PROCESSING.")
    start_time: Optional[float] = Field(None, description="Unix timestamp of when recording started.")


# ==========================================
# AUTHENTICATION & GATEWAY DECORATORS
# ==========================================

def get_current_user(authorization: str = Header(..., description="Bearer JWT token forwarded by gateway")) -> dict:
    """
    Decodes the user context from the incoming Gateway authentication header.

    Inputs:
        authorization (str): 'Bearer <JWT_TOKEN>' header string.

    Outputs:
        dict: Parsed JWT claims (user_id, role) from token payload.
    
    Raises:
        HTTPException: 401 if token is expired, invalid, or malformed.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization schema. Must be Bearer token."
        )
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return {
            "user_id": payload.get("user_id"),
            "role": payload.get("role", "Patient")
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session credentials have expired."
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed or invalid session credentials."
        )


# ==========================================
# ROUTING ENDPOINTS
# ==========================================

@app.post("/rooms/token", response_model=TokenResponse)
async def get_room_token(
    payload: TokenRequest,
    user: dict = Depends(get_current_user)
) -> TokenResponse:
    """
    Verifies eligibility for an appointment via the Scheduling service and returns
    a signed LiveKit room JWT token for the user.

    Inputs:
        payload (TokenRequest): Request payload containing the target appointment UUID.
        user (dict): Extracted user context payload from auth token.

    Outputs:
        TokenResponse: LiveKit credentials including signed JWT token, room, and identity.
    """
    app_id = str(payload.appointment_id)
    user_id = str(user["user_id"])
    
    # 1. Query Scheduling microservice to fetch appointment details
    scheduling_url = f"{settings.SERVICE_SCHEDULING_URL}/appointments/{app_id}"
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(scheduling_url, timeout=5.0)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to communicate with scheduling microservice: {str(e)}"
        )

    if resp.status_code == 404:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment record not found."
        )
    elif resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scheduling microservice returned an error status: {resp.status_code}"
        )

    appointment_data = resp.json()
    
    # 2. HIPAA Access Control Check: Verify requesting user is patient or doctor of the appointment
    patient_id = str(appointment_data.get("patient_id"))
    doctor_id = str(appointment_data.get("doctor_id"))
    
    if user_id not in (patient_id, doctor_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HIPAA Enforcement: You are not authorized to access this consultation room."
        )

    # 3. Retrieve user display name from Scheduling service
    user_url = f"{settings.SERVICE_SCHEDULING_URL}/users/{user_id}"
    user_name = "Telehealth User"
    try:
        async with httpx.AsyncClient() as client:
            user_resp = await client.get(user_url, timeout=5.0)
            if user_resp.status_code == 200:
                user_name = user_resp.json().get("name", user_name)
    except Exception:
        # Fallback gracefully to default display name on scheduling call fail
        pass

    # 4. Generate LiveKit Room Token
    room_name = f"appointment_{app_id}"
    
    # Structure LiveKit Video Grants payload
    lk_payload = {
        "iss": settings.LIVEKIT_API_KEY,
        "sub": user_id,
        "name": user_name,
        "video": {
            "room": room_name,
            "roomJoin": True,
            "canPublish": True,
            "canSubscribe": True,
            "canPublishData": True
        },
        "exp": int(time.time()) + 7200,  # Valid for 2 hours
        "nbf": int(time.time()) - 60     # Leeway clock offset
    }
    
    lk_token = jwt.encode(lk_payload, settings.LIVEKIT_API_SECRET, algorithm="HS256")
    
    # Return room details
    return TokenResponse(
        token=lk_token,
        room_name=room_name,
        identity=user_id,
        name=user_name
    )


@app.get("/rooms/voice-token", response_model=TokenResponse)
async def get_voice_agent_token(
    user: dict = Depends(get_current_user)
) -> TokenResponse:
    """
    Generates a signed LiveKit room JWT token for the user to connect to the
    conversational voice agent room.
    """
    user_id = str(user["user_id"])
    
    # 1. Retrieve user display name from Scheduling service
    user_url = f"{settings.SERVICE_SCHEDULING_URL}/users/{user_id}"
    user_name = "Telehealth Voice User"
    try:
        async with httpx.AsyncClient() as client:
            user_resp = await client.get(user_url, timeout=5.0)
            if user_resp.status_code == 200:
                user_name = user_resp.json().get("name", user_name)
    except Exception:
        pass

    # 2. Generate LiveKit Room Token for the conversational voice agent session
    room_name = f"voice_session_{user_id}"
    
    lk_payload = {
        "iss": settings.LIVEKIT_API_KEY,
        "sub": user_id,
        "name": user_name,
        "video": {
            "room": room_name,
            "roomJoin": True,
            "canPublish": True,
            "canSubscribe": True,
            "canPublishData": True
        },
        "exp": int(time.time()) + 3600,  # Valid for 1 hour
        "nbf": int(time.time()) - 60
    }
    
    lk_token = jwt.encode(lk_payload, settings.LIVEKIT_API_SECRET, algorithm="HS256")
    
    return TokenResponse(
        token=lk_token,
        room_name=room_name,
        identity=user_id,
        name=user_name
    )


@app.post("/rooms/{room_name}/scribe/start", response_model=ScribeStartResponse)
async def start_scribe(
    room_name: str,
    user: dict = Depends(get_current_user)
) -> ScribeStartResponse:
    """
    Triggers the headless recording bot task. If docker is available, spins up a
    playwright container task. Otherwise, registers a mock recording task.

    Inputs:
        room_name (str): LiveKit room string (format: 'appointment_<uuid>').
        user (dict): Extracted user context payload from token.

    Outputs:
        ScribeStartResponse: Recording status and container execution attributes.
    """
    # Verify requesting user is a Doctor (only doctors can control scribes)
    if user["role"] != "Doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Only clinical providers can toggle the AI Scribe bot."
        )

    # Parse appointment ID from room name
    if not room_name.startswith("appointment_"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Malformed room name format. Expects 'appointment_<uuid>'."
        )
    appointment_id = room_name.replace("appointment_", "")

    if room_name in active_scribes:
        return ScribeStartResponse(
            status=active_scribes[room_name]["status"],
            room_name=room_name,
            container_id=active_scribes[room_name].get("container_id")
        )

    # Create local/host output directory if missing
    os.makedirs(settings.RECORDING_DIR, exist_ok=True)
    os.makedirs(os.path.join(settings.RECORDING_DIR, room_name), exist_ok=True)

    # 1. Generate LiveKit token for the recording bot (subscribe-only access)
    bot_identity = f"recorder_bot_{appointment_id}"
    bot_payload = {
        "iss": settings.LIVEKIT_API_KEY,
        "sub": bot_identity,
        "name": "AI Clinical Scribe",
        "video": {
            "room": room_name,
            "roomJoin": True,
            "canPublish": False,
            "canSubscribe": True,
            "canPublishData": False
        },
        "exp": int(time.time()) + 7200,
        "nbf": int(time.time()) - 60
    }
    bot_token = jwt.encode(bot_payload, settings.LIVEKIT_API_SECRET, algorithm="HS256")

    # 2. Run Container or fall back to Simulator Mode
    if docker_client is not None:
        try:
            container_name = f"recorder_{room_name}"
            # Ensure any stale container with same name is removed first
            try:
                stale = docker_client.containers.get(container_name)
                stale.stop()
                stale.remove()
            except Exception:
                pass

            # Spin up playwright recording bot container in background
            container = docker_client.containers.run(
                image="medical-ai-recorder:latest",
                name=container_name,
                detach=True,
                restart_policy={"Name": "no"},
                environment={
                    "LIVEKIT_URL": settings.LIVEKIT_URL,
                    "LIVEKIT_TOKEN": bot_token,
                    "ROOM_NAME": room_name,
                    "RECORDING_DIR": "/tmp/recording"
                },
                volumes={
                    os.path.abspath(settings.RECORDING_DIR): {
                        "bind": "/tmp/recording",
                        "mode": "rw"
                    }
                }
            )

            active_scribes[room_name] = {
                "status": "RECORDING",
                "container_id": container.id,
                "is_mock": False,
                "start_time": time.time(),
                "appointment_id": appointment_id
            }

            return ScribeStartResponse(
                status="RECORDING",
                room_name=room_name,
                container_id=container.id
            )

        except Exception as e:
            print(f"Error spinning up docker container: {e}. Falling back to mock recorder.")
            # Graceful fallback to mock recording on container launch exception

    # --- MOCK SIMULATION MODE PATH ---
    # Create mock audio source files immediately inside the recording directory
    room_dir = os.path.join(settings.RECORDING_DIR, room_name)
    
    # Write mock audio files for testing (empty dummy WAV file skeletons)
    # We will write simple dummy text or mock WAV headers to check script flows
    with open(os.path.join(room_dir, "patient_audio.wav"), "w") as f:
        f.write("MOCK PATIENT WAV CONTENT RECORDING START " + datetime.now().isoformat())
    with open(os.path.join(room_dir, "doctor_audio.wav"), "w") as f:
        f.write("MOCK DOCTOR WAV CONTENT RECORDING START " + datetime.now().isoformat())

    active_scribes[room_name] = {
        "status": "MOCK_ACTIVE",
        "container_id": None,
        "is_mock": True,
        "start_time": time.time(),
        "appointment_id": appointment_id
    }

    return ScribeStartResponse(
        status="MOCK_ACTIVE",
        room_name=room_name,
        container_id=None
    )


@app.post("/rooms/{room_name}/scribe/stop")
async def stop_scribe(
    room_name: str,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user)
) -> dict:
    """
    Stops the active recorder container/mock and triggers the post-call audio
    alignment mixing and S3 archiving pipelines asynchronously.

    Inputs:
        room_name (str): LiveKit room string (format: 'appointment_<uuid>').
        background_tasks (BackgroundTasks): FastAPI queue for post-call jobs.
        user (dict): Extracted user context payload from token.

    Outputs:
        dict: Processing status acknowledgement.
    """
    if user["role"] != "Doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Only clinical providers can toggle the AI Scribe bot."
        )

    if room_name not in active_scribes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active recording bot found for this consult room."
        )

    scribe_info = active_scribes.pop(room_name)
    container_id = scribe_info.get("container_id")
    is_mock = scribe_info["is_mock"]
    appointment_id = scribe_info["appointment_id"]

    # 1. Stop and remove docker container if active
    if container_id and docker_client:
        try:
            container = docker_client.containers.get(container_id)
            container.stop(timeout=5)
            container.remove()
        except Exception as e:
            print(f"Error clean stopping container {container_id}: {e}")

    # 2. Trigger audio post-processing task (FFmpeg mix, encrypt, upload to S3)
    from app.process_audio import process_appointment_audio
    background_tasks.add_task(
        process_appointment_audio,
        appointment_id=appointment_id,
        room_name=room_name,
        is_mock=is_mock
    )

    return {
        "status": "PROCESSING",
        "detail": "Recorder stop signal processed. Audio post-processing launched."
    }


@app.get("/rooms/{room_name}/scribe/status", response_model=ScribeStatusResponse)
def get_scribe_status(room_name: str) -> ScribeStatusResponse:
    """
    Retrieves the status of the recording bot for a given consult room.

    Inputs:
        room_name (str): Target consult room string.

    Outputs:
        ScribeStatusResponse: Status details (STANDBY, RECORDING, MOCK_ACTIVE).
    """
    if room_name not in active_scribes:
        return ScribeStatusResponse(status="STANDBY", start_time=None)
    
    info = active_scribes[room_name]
    return ScribeStatusResponse(
        status=info["status"],
        start_time=info["start_time"]
    )


@app.post("/webhooks/livekit")
async def livekit_webhook(
    event_data: dict,
    background_tasks: BackgroundTasks
) -> dict:
    """
    Receives Room Finished webhook events from LiveKit server SFU to trigger automatic
    cleanup of recording sessions in case participants disconnected unexpectedly.

    Inputs:
        event_data (dict): LiveKit Webhook raw body.
        background_tasks (BackgroundTasks): Background queue helper.

    Outputs:
        dict: Webhook event receipt status.
    """
    event = event_data.get("event")
    room_info = event_data.get("room", {})
    room_name = room_info.get("name")

    if event == "room_finished" and room_name and room_name in active_scribes:
        scribe_info = active_scribes.pop(room_name)
        container_id = scribe_info.get("container_id")
        is_mock = scribe_info["is_mock"]
        appointment_id = scribe_info["appointment_id"]

        if container_id and docker_client:
            try:
                container = docker_client.containers.get(container_id)
                container.stop(timeout=5)
                container.remove()
            except Exception:
                pass

        # Trigger automatic post-processing
        from app.process_audio import process_appointment_audio
        background_tasks.add_task(
            process_appointment_audio,
            appointment_id=appointment_id,
            room_name=room_name,
            is_mock=is_mock
        )
        return {"status": "auto_cleaned", "room": room_name}

    return {"status": "ignored"}
