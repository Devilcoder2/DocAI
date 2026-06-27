import logging
from typing import Optional
from fastapi import FastAPI, Request, HTTPException, status, WebSocket, WebSocketDisconnect, Form
from fastapi.responses import JSONResponse
from app.config import settings

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("scribe.main")

app = FastAPI(
    title="Clinical AI Scribe & Agent Engine",
    description="Microservice managing Whisper transcription, SOAP note synthesis, Care Companion chat, and Twilio booking agent.",
    version="1.0.0"
)

@app.get("/health")
def health_check():
    """
    Standard microservice health check endpoint.
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


@app.websocket("/companion")
async def companion_chat_websocket(websocket: WebSocket):
    """
    WebSocket endpoint managing post-visit Care Companion conversation sessions.
    Runs stateful LangGraph RAG matching patient questions to their care plan.
    """
    await websocket.accept()
    logger.info("[*] Care Companion WebSocket connection accepted.")
    
    appointment_id = None
    try:
        # First message should be initialization details containing JWT token and appointment_id
        init_data = await websocket.receive_json()
        appointment_id = init_data.get("appointment_id")
        
        if not appointment_id:
            await websocket.send_json({"error": "Missing appointment_id in initialization."})
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        logger.info(f"[*] Initialized Care Companion session for appointment: {appointment_id}")
        await websocket.send_json({
            "status": "connected",
            "message": "Care Companion is active. How can I help you with your care plan?"
        })
        
        # Maintain history of dialog turns in this session
        messages = [
            {"role": "assistant", "content": "Hello! I am your post-visit Care Companion. How can I help you with your approved care plan today?"}
        ]
        
        while True:
            data = await websocket.receive_json()
            user_msg = data.get("message")
            if not user_msg:
                continue
                
            messages.append({"role": "user", "content": user_msg})
            
            # Invoke LangGraph Care Companion Graph
            from app.companion import companion_agent
            initial_state = {
                "appointment_id": appointment_id,
                "messages": messages,
                "care_plan_context": "",
                "history_summary": "",
                "escalation_triggered": False,
                "response": ""
            }
            
            # Blocking execution of compile LangGraph graph
            final_state = companion_agent.invoke(initial_state)
            
            response_text = final_state.get("response", "I'm sorry, I encountered an issue parsing your query.")
            escalation_triggered = final_state.get("escalation_triggered", False)
            
            messages.append({"role": "assistant", "content": response_text})
            
            await websocket.send_json({
                "response": response_text,
                "escalation_triggered": escalation_triggered
            })
            
    except WebSocketDisconnect:
        logger.info(f"[*] Care Companion WebSocket disconnected for appointment: {appointment_id}")
    except Exception as e:
        logger.error(f"[-] Error in WebSocket handler: {e}", exc_info=True)
        try:
            await websocket.send_json({"error": "Internal server error occurred."})
            await websocket.close()
        except Exception:
            pass


@app.post("/booking/twilio")
async def twilio_booking_webhook(
    Body: Optional[str] = Form(None),
    SpeechResult: Optional[str] = Form(None),
    From: Optional[str] = Form(None),
    is_voice: Optional[bool] = False
):
    """
    Twilio voice and text webhook handling screening triage and slots reservations.
    """
    from app.booking_agent import handle_twilio_booking_webhook
    return await handle_twilio_booking_webhook(
        body_text=Body,
        speech_result=SpeechResult,
        from_number=From,
        is_voice=bool(is_voice)
    )
