import logging
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
from app.config import settings

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("scribe.main")

app = FastAPI(
    title="Clinical AI Scribe Service",
    description="Microservice managing Whisper speech-to-text transcription and SOAP note synthesis.",
    version="1.0.0"
)

@app.get("/health")
def health_check():
    """
    Standard microservice health check endpoint.

    Outputs:
        dict: Status indicators.
    """
    return {
        "status": "healthy",
        "service": "scribe-ai-pipeline"
    }

@app.post("/diagnose/transcribe")
async def manual_transcribe_trigger(request: Request):
    """
    Diagnostic manual trigger endpoint allowing testing of the transcription
    and SOAP note synthesization pipeline.

    Inputs:
        request (Request): FastAPI request wrapper.

    Outputs:
        JSONResponse: Resulting SOAP clinical note draft.
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload.")

    appointment_id = body.get("appointment_id")
    s3_path = body.get("s3_path")
    is_mock = body.get("is_mock", True)

    if not appointment_id or not s3_path:
        raise HTTPException(status_code=400, detail="Both 'appointment_id' and 's3_path' are required.")

    # Import locally to prevent cyclic imports
    from app.consumer import process_event
    
    logger.info(f"Manual diagnostic trigger received for appointment: {appointment_id}")
    success = process_event({
        "appointment_id": appointment_id,
        "s3_path": s3_path,
        "is_mock": is_mock
    })

    if success:
        return {"status": "success", "detail": "SOAP clinical note generated and saved."}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Transcription processing failed. Check logs."
        )
