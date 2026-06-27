import os
import logging
import json
import httpx
from typing import Dict, Any, Optional
from fastapi import Form, Response

logger = logging.getLogger(__name__)

# Service scheduling URL setup
SERVICE_SCHEDULING_URL = os.getenv("SERVICE_SCHEDULING_URL", "http://localhost:8001")

# Red-flag symptoms for Twilio Booking Triage
EMERGENCY_TRIAGE_FLAGS = [
    "chest pain", "shortness of breath", "breathing issue", "severe bleeding", 
    "paralysis", "sudden weakness", "worst headache", "headache and fever",
    "seizure", "unconscious", "head injury", "heart attack", "stroke"
]


def check_emergency_symptoms(text: str) -> bool:
    """
    Checks if the user-provided voice/text transcript contains emergency flags.
    """
    text_lower = text.lower()
    return any(flag in text_lower for flag in EMERGENCY_TRIAGE_FLAGS)


async def call_scheduling_availability(doctor_id: str, date_str: str) -> list:
    """
    Calls scheduling service availability check API.
    """
    try:
        async with httpx.AsyncClient() as client:
            url = f"{SERVICE_SCHEDULING_URL}/doctors/{doctor_id}/availability"
            resp = await client.get(url, params={"date": date_str}, timeout=5.0)
            if resp.status_code == 200:
                return resp.json()
            logger.error(f"Failed checking availability: {resp.status_code} - {resp.text}")
    except Exception as e:
        logger.error(f"Error checking doctor availability: {e}")
    return []


async def call_scheduling_book(payload: dict) -> Optional[dict]:
    """
    Calls scheduling service to book an appointment.
    """
    try:
        async with httpx.AsyncClient() as client:
            url = f"{SERVICE_SCHEDULING_URL}/appointments"
            headers = {"X-User-Id": payload.get("patient_id")}
            resp = await client.post(url, json=payload, headers=headers, timeout=5.0)
            if resp.status_code in [200, 201]:
                return resp.json()
            logger.error(f"Failed booking appointment: {resp.status_code} - {resp.text}")
    except Exception as e:
        logger.error(f"Error booking appointment: {e}")
    return None


async def handle_twilio_booking_webhook(
    body_text: Optional[str] = None,
    speech_result: Optional[str] = None,
    from_number: Optional[str] = None,
    is_voice: bool = False
) -> Response:
    """
    Processes Twilio webhook payload. Parses transcript/text, performs emergency triage checking,
    queries/reserves bookings, and formats the output into clean TwiML XML.
    """
    # 1. Gather user input text
    input_text = body_text or speech_result or ""
    input_text_stripped = input_text.strip()
    
    logger.info(f"[*] Twilio Webhook received. Input: '{input_text_stripped}' | Voice: {is_voice} | From: {from_number}")
    
    # 2. Check emergency triage
    if check_emergency_symptoms(input_text_stripped):
        logger.warning("[!] Emergency triage triggered on Twilio Booking Bot!")
        if is_voice:
            twiml_content = (
                "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
                "<Response>\n"
                "    <Say>We detect potential emergency symptoms. Please call 9 1 1 immediately or go to the nearest emergency room. We cannot book appointments for emergency conditions. Goodbye.</Say>\n"
                "    <Hangup/>\n"
                "</Response>"
            )
        else:
            twiml_content = (
                "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
                "<Response>\n"
                "    <Message>We detect potential emergency symptoms. Please call 911 immediately or go to the nearest emergency room. We cannot book appointments for emergency conditions.</Message>\n"
                "</Response>"
            )
        return Response(content=twiml_content, media_type="application/xml")

    # 3. Simulate dialogue flow / tool calls
    input_lower = input_text_stripped.lower()
    
    # Simple rule-based dialogue state response (or simulated LLM response logic)
    # Allows robust testing without cloud dependencies
    if not input_text_stripped:
        message = "Hello! Welcome to the clinic booking assistant. Are you looking to book an annual physical or a follow-up consultation?"
    elif "annual physical" in input_lower or "book" in input_lower or "physical" in input_lower:
        # Mock lookup: check availability for Doctor ID
        # In a real environment, we'd query doctors list first. We use a mock doctor id for testing.
        doctor_id = "11111111-1111-1111-1111-111111111111"
        date_str = "2026-07-15"
        slots = await call_scheduling_availability(doctor_id, date_str)
        if slots:
            message = f"I found an available slot for your physical on {date_str} at {slots[0]}. Would you like to confirm this booking?"
        else:
            message = f"I check availability for {date_str} but no slots are open. Please check another date."
    elif "confirm" in input_lower or "yes" in input_lower:
        # Perform slot booking
        # We fetch or mock user credentials for patient
        doctor_id = "11111111-1111-1111-1111-111111111111"
        patient_id = "22222222-2222-2222-2222-222222222222"
        booking_payload = {
            "doctor_id": doctor_id,
            "patient_id": patient_id,
            "appointment_time": "2026-07-15T09:00:00",
            "consult_type": "in_person",
            "reason_for_visit": "Annual physical booked via Twilio bot"
        }
        res = await call_scheduling_book(booking_payload)
        if res:
            message = f"Thank you! Your physical is confirmed for {res.get('appointment_time')}. A confirmation SMS has been sent."
        else:
            message = "I encountered an error trying to finalize your booking. Please try again or contact the front desk."
    else:
        message = "I can help you search availability and book appointments. Please specify if you need a physical or follow-up consult."

    # 4. Wrap response in TwiML format
    if is_voice:
        twiml_content = (
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
            "<Response>\n"
            f"    <Say>{message}</Say>\n"
            "    <Gather input=\"speech\" timeout=\"5\" numDigits=\"1\">\n"
            "        <Say>You can reply or say confirm to continue.</Say>\n"
            "    </Gather>\n"
            "</Response>"
        )
    else:
        twiml_content = (
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
            "<Response>\n"
            f"    <Message>{message}</Message>\n"
            "</Response>"
        )
        
    return Response(content=twiml_content, media_type="application/xml")
