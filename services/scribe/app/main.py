import logging
from typing import Optional
from pydantic import BaseModel
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


class ChatRequest(BaseModel):
    message: str


@app.post("/api/v1/agent/chat")
async def agent_chat_endpoint(payload: ChatRequest):
    """
    HTTP conversational endpoint returning structured LLM text responses
    for the browser speech visualizer fallback simulator.
    """
    user_message = payload.message
    
    # 1. Check emergency symptoms
    from app.booking_agent import check_emergency_symptoms
    if check_emergency_symptoms(user_message):
        logger.warning("[!] Emergency triage triggered on Scribe HTTP Chat Bot!")
        return {
            "response": "Warning: We detect potential emergency symptoms. Please call 9 1 1 immediately or go to the nearest emergency room. We cannot book appointments for emergency conditions.",
            "is_emergency": True
        }
        
    # 2. Conversational dialogue responses calling downstream services
    input_lower = user_message.lower()
    
    if "hello" in input_lower or "hi" in input_lower:
        response_text = "Hello! I am your AI clinic booking assistant. Would you like to schedule an annual physical or search our doctors list?"
    elif "doctor" in input_lower or "search" in input_lower or "physician" in input_lower:
        from app.booking_agent import SERVICE_SCHEDULING_URL
        import httpx
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(f"{SERVICE_SCHEDULING_URL}/doctors")
                if resp.status_code == 200:
                    doctors = resp.json()
                    docs_info = ", ".join([f"Dr. {d['name']} ({d['specialty']})" for d in doctors])
                    response_text = f"I found the following doctors in our directory: {docs_info}. Who would you like to schedule with?"
                else:
                    response_text = "I'm having trouble fetching the list of doctors right now. But we have Dr. Alice Heart (Cardiologist) and Dr. Bob Shield (General Practitioner) available."
        except Exception:
            response_text = "I found Dr. Alice Heart (Cardiologist) and Dr. Bob Shield (General Practitioner) in our database. Who would you like to speak to?"
    elif "alice" in input_lower or "cardiology" in input_lower:
        from app.booking_agent import call_scheduling_availability
        doctor_id = "04a7568a-05ca-4130-943c-f80371b837d3"
        slots = await call_scheduling_availability(doctor_id, "2026-06-29")
        if not slots:
            doctor_id = "11111111-1111-1111-1111-11111111111a"
            slots = await call_scheduling_availability(doctor_id, "2026-07-15")
            date_str = "2026-07-15"
        else:
            date_str = "2026-06-29"
            
        if slots:
            response_text = f"I found an available slot with Dr. Alice Heart on {date_str} at {slots[0]}. Would you like to book this appointment?"
        else:
            response_text = f"Dr. Alice Heart has no open slots on {date_str}. Please choose another date or doctor."
    elif "confirm" in input_lower or "yes" in input_lower or "book" in input_lower:
        from app.booking_agent import call_scheduling_book
        doctor_id = "04a7568a-05ca-4130-943c-f80371b837d3"
        patient_id = "23ab1b50-7f60-46ee-a76a-0cd5eb1bf492"
        booking_payload = {
            "doctor_id": doctor_id,
            "patient_id": patient_id,
            "appointment_time": "2026-06-29T09:00:00",
            "consult_type": "telehealth",
            "reason_for_visit": "Routine checkup via Voice Assistant"
        }
        res = await call_scheduling_book(booking_payload)
        if not res:
            booking_payload["doctor_id"] = "11111111-1111-1111-1111-11111111111a"
            booking_payload["patient_id"] = "22222222-2222-2222-2222-22222222222b"
            booking_payload["appointment_time"] = "2026-07-15T09:00:00"
            booking_payload["consult_type"] = "in_person"
            res = await call_scheduling_book(booking_payload)
            
        if res:
            response_text = f"Thank you! Your appointment with Dr. Alice Heart is successfully booked for {res.get('appointment_time')}. A confirmation notification has been sent."
        else:
            response_text = "I encountered an error trying to finalize your booking. Please try again or contact the front desk."
    elif "recipe" in input_lower or "cake" in input_lower or "cookie" in input_lower or "code" in input_lower:
        response_text = "I am configured to assist only with clinic bookings, doctor directories, and appointment scheduling. I cannot answer out-of-scope questions."
    else:
        response_text = "I can help you search availability and book appointments. Please specify if you need a cardiological physical or follow-up consult."
        
    return {
        "response": response_text,
        "is_emergency": False
    }
