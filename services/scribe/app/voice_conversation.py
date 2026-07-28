"""Shared, safety-first booking conversation engine.

This module is deliberately independent of a speech provider.  LiveKit and the
browser fallback both submit recognised text here, so they follow exactly the
same identity, safety, availability, and booking rules.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from typing import Any, Literal
from uuid import uuid4

import httpx
from pydantic import BaseModel, Field

from app.config import settings


EMERGENCY_PATTERNS = (
    "chest pain", "shortness of breath", "severe bleeding", "heart attack",
    "stroke", "seizure", "unconscious", "sudden weakness", "paralysis",
    "saans nahi", "saans lene", "seene mein dard", "सीने में दर्द",
    "सांस नहीं", "बहुत खून", "बेहोश", "लकवा",
)
OUT_OF_SCOPE_PATTERNS = (
    "recipe", "cake", "programming", "write code", "stock price", "joke",
)
YES_WORDS = {"yes", "yeah", "yep", "confirm", "haan", "ha", "हाँ", "हां", "confirm karo"}


class VoiceAction(BaseModel):
    id: str
    label: str
    kind: Literal["message", "select_slot", "confirm_booking"]
    doctor_id: str | None = None
    appointment_time: str | None = None
    consult_type: str | None = None


class ConversationReply(BaseModel):
    conversation_id: str
    response: str
    language: Literal["en", "hi", "hinglish"] = "en"
    state: Literal["ready", "awaiting_slot", "awaiting_confirmation", "ended", "unavailable"] = "ready"
    is_emergency: bool = False
    requires_confirmation: bool = False
    transcript: str | None = None
    actions: list[VoiceAction] = Field(default_factory=list)


@dataclass
class PendingBooking:
    doctor_id: str
    doctor_name: str
    appointment_time: str
    consult_type: str
    reason_for_visit: str


@dataclass
class Conversation:
    patient_id: str
    language: Literal["en", "hi", "hinglish"] = "en"
    pending: PendingBooking | None = None
    turns: list[dict[str, str]] = field(default_factory=list)


class VoiceConversationEngine:
    """In-memory conversations backed by live scheduling calls.

    The store is intentionally small and can later be replaced by Redis without
    changing the HTTP or LiveKit interfaces.
    """

    def __init__(self) -> None:
        self._conversations: dict[str, Conversation] = {}

    @staticmethod
    def detect_language(text: str) -> Literal["en", "hi", "hinglish"]:
        if re.search(r"[\u0900-\u097F]", text):
            return "hi"
        lowered = text.lower()
        if any(word in lowered for word in ("haan", "nahi", "kya", "doctor chahiye", "mujhe", "kal")):
            return "hinglish"
        return "en"

    @staticmethod
    def _copy(language: str, english: str, hindi: str, hinglish: str) -> str:
        return {"hi": hindi, "hinglish": hinglish}.get(language, english)

    @staticmethod
    def _emergency(text: str) -> bool:
        lowered = text.lower()
        return any(pattern in lowered for pattern in EMERGENCY_PATTERNS)

    @staticmethod
    def _out_of_scope(text: str) -> bool:
        lowered = text.lower()
        return any(pattern in lowered for pattern in OUT_OF_SCOPE_PATTERNS)

    def _conversation(self, patient_id: str, conversation_id: str | None) -> tuple[str, Conversation]:
        session_id = conversation_id or str(uuid4())
        existing = self._conversations.get(session_id)
        if existing and existing.patient_id != patient_id:
            # Never let a client reuse another patient's conversation context.
            session_id = str(uuid4())
            existing = None
        if not existing:
            existing = Conversation(patient_id=patient_id)
            self._conversations[session_id] = existing
        return session_id, existing

    async def _get(self, path: str, **params: Any) -> Any:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(f"{settings.SERVICE_SCHEDULING_URL}{path}", params=params)
            response.raise_for_status()
            return response.json()

    async def _book(self, patient_id: str, pending: PendingBooking) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.post(
                f"{settings.SERVICE_SCHEDULING_URL}/appointments",
                headers={"X-User-Id": patient_id},
                json={
                    "doctor_id": pending.doctor_id,
                    "appointment_time": pending.appointment_time,
                    "consult_type": pending.consult_type,
                    "reason_for_visit": pending.reason_for_visit,
                },
            )
            response.raise_for_status()
            return response.json()

    async def _doctor_matches(self, query: str) -> list[dict[str, Any]]:
        doctors = await self._get("/doctors")
        terms = [term for term in re.findall(r"[a-zA-Z]{3,}", query.lower()) if term not in {"doctor", "appointment", "book", "with", "need", "want"}]
        if not terms:
            return doctors
        matches = []
        for doctor in doctors:
            searchable = f"{doctor.get('specialty', '')} {doctor.get('user', {}).get('name', '')} {doctor.get('clinic_address', '')}".lower()
            if any(term in searchable for term in terms):
                matches.append(doctor)
        return matches or doctors

    async def _slots(self, doctor_id: str) -> list[str]:
        # Show the next real slots over the coming fortnight, never fabricated dates.
        for offset in range(0, 15):
            target = date.today() + timedelta(days=offset)
            slots = await self._get(f"/doctors/{doctor_id}/availability", date=target.isoformat())
            if slots:
                return slots[:4]
        return []

    async def respond(
        self,
        *,
        patient_id: str,
        message: str = "",
        conversation_id: str | None = None,
        action: str | None = None,
        doctor_id: str | None = None,
        appointment_time: str | None = None,
        consult_type: str = "telehealth",
        reason_for_visit: str | None = None,
    ) -> ConversationReply:
        session_id, conversation = self._conversation(patient_id, conversation_id)
        text = (message or "").strip()
        if text:
            conversation.language = self.detect_language(text)
            conversation.turns.append({"role": "user", "content": text})
        language = conversation.language

        if self._emergency(text):
            return ConversationReply(
                conversation_id=session_id,
                language=language,
                state="ended",
                is_emergency=True,
                response=self._copy(language,
                    "This may be an emergency. Please call 112 now or go to the nearest emergency department. I cannot book an appointment for this.",
                    "यह आपातकाल हो सकता है। कृपया अभी 112 पर कॉल करें या नज़दीकी अस्पताल जाएँ। मैं इसके लिए अपॉइंटमेंट बुक नहीं कर सकता।",
                    "Yeh emergency ho sakti hai. Please abhi 112 par call karein ya nearest hospital jaayein. Main iske liye appointment book nahi kar sakta."),
                transcript=text or None,
            )

        if self._out_of_scope(text):
            return ConversationReply(
                conversation_id=session_id, language=language, transcript=text or None,
                response=self._copy(language,
                    "I can help you find a doctor, check appointment times, or book a visit. I cannot help with that request.",
                    "मैं डॉक्टर ढूँढने, समय देखने या अपॉइंटमेंट बुक करने में मदद कर सकता हूँ। मैं इस अनुरोध में मदद नहीं कर सकता।",
                    "Main doctor dhoondne, time dekhne ya appointment book karne mein help kar sakta hoon. Is request mein help nahi kar sakta."),
            )

        if action == "confirm_booking" or (conversation.pending and text.lower() in YES_WORDS):
            if not conversation.pending:
                return ConversationReply(conversation_id=session_id, language=language, transcript=text or None,
                    response=self._copy(language, "Please choose a time first.", "कृपया पहले समय चुनें।", "Pehle time choose karein."))
            try:
                booking = await self._book(patient_id, conversation.pending)
            except httpx.HTTPStatusError as exc:
                conversation.pending = None
                detail = "That time is no longer available. Please choose another slot."
                if exc.response.status_code >= 500:
                    detail = "I could not complete the booking right now. Please try again."
                return ConversationReply(conversation_id=session_id, language=language, transcript=text or None, state="ready", response=detail)
            pending = conversation.pending
            conversation.pending = None
            return ConversationReply(
                conversation_id=session_id, language=language, transcript=text or None,
                response=self._copy(language,
                    f"Your appointment with {pending.doctor_name} on {booking['appointment_time']} is confirmed.",
                    f"{pending.doctor_name} के साथ आपका अपॉइंटमेंट {booking['appointment_time']} के लिए पक्का हो गया है।",
                    f"{pending.doctor_name} ke saath aapka appointment {booking['appointment_time']} ke liye confirm ho gaya hai."),
            )

        if action == "select_slot":
            if not doctor_id or not appointment_time:
                return ConversationReply(conversation_id=session_id, language=language, state="awaiting_slot", transcript=text or None,
                    response="Please select a valid appointment time.")
            doctors = await self._get("/doctors")
            doctor = next((item for item in doctors if str(item["id"]) == doctor_id), None)
            if not doctor:
                return ConversationReply(conversation_id=session_id, language=language, transcript=text or None, response="I could not find that doctor. Please search again.")
            available = await self._slots(doctor_id)
            if appointment_time not in available:
                return ConversationReply(conversation_id=session_id, language=language, state="awaiting_slot", transcript=text or None,
                    response="That time is no longer available. Please select another available time.")
            conversation.pending = PendingBooking(
                doctor_id=doctor_id,
                doctor_name=doctor["user"]["name"],
                appointment_time=appointment_time,
                consult_type=consult_type if consult_type in {"telehealth", "in_person"} else "telehealth",
                reason_for_visit=(reason_for_visit or "Appointment requested through voice assistant").strip(),
            )
            time_label = datetime.fromisoformat(appointment_time).strftime("%a, %d %b at %I:%M %p")
            return ConversationReply(
                conversation_id=session_id, language=language, state="awaiting_confirmation", transcript=text or None,
                requires_confirmation=True,
                response=self._copy(language,
                    f"I will book {doctor['user']['name']} for {time_label}. Please confirm.",
                    f"मैं {doctor['user']['name']} के लिए {time_label} का समय बुक करूँगा। कृपया पुष्टि करें।",
                    f"Main {doctor['user']['name']} ke liye {time_label} book karunga. Please confirm karein."),
                actions=[VoiceAction(id="confirm", label="Confirm booking", kind="confirm_booking")],
            )

        lowered = text.lower()
        if any(word in lowered for word in ("history", "past appointment", "previous visit", "purana", "पिछला")):
            appointments = await self._get("/appointments", patient_id=patient_id)
            if not appointments:
                response = self._copy(language, "You do not have any appointment history yet.", "आपकी कोई पुरानी अपॉइंटमेंट नहीं है।", "Aapki koi purani appointment nahi hai.")
            else:
                items = [f"{item['appointment_time']}" for item in appointments[:3]]
                response = self._copy(language, f"Your recent appointments are: {', '.join(items)}.", f"आपकी हाल की अपॉइंटमेंट: {', '.join(items)}।", f"Aapki recent appointments: {', '.join(items)}.")
            return ConversationReply(conversation_id=session_id, language=language, transcript=text or None, response=response)

        # A search is the safe default. The user selects a real slot before any booking can occur.
        try:
            doctors = await self._doctor_matches(text)
        except httpx.HTTPError:
            return ConversationReply(conversation_id=session_id, language=language, state="unavailable", transcript=text or None,
                response=self._copy(language, "I cannot reach appointment services right now. Please try again shortly.", "अभी अपॉइंटमेंट सेवा उपलब्ध नहीं है। कृपया थोड़ी देर बाद कोशिश करें।", "Abhi appointment service available nahi hai. Thodi der baad try karein."))
        if not doctors:
            return ConversationReply(conversation_id=session_id, language=language, transcript=text or None,
                response=self._copy(language, "I could not find a matching doctor. Try a specialty such as heart, skin, or general care.", "मिलता-जुलता डॉक्टर नहीं मिला। हृदय, त्वचा या सामान्य देखभाल जैसी विशेषज्ञता बताइए।", "Matching doctor nahi mila. Heart, skin ya general care jaisi specialty bataiye."))

        doctor = doctors[0]
        slots = await self._slots(str(doctor["id"]))
        if not slots:
            return ConversationReply(conversation_id=session_id, language=language, transcript=text or None,
                response=self._copy(language, f"{doctor['user']['name']} has no open times in the next 14 days. Please try another doctor.", f"{doctor['user']['name']} के पास अगले 14 दिनों में समय नहीं है। दूसरा डॉक्टर चुनें।", f"{doctor['user']['name']} ke paas agle 14 din mein time nahi hai. Dusra doctor choose karein."))
        actions = [
            VoiceAction(
                id=f"slot-{index}", label=datetime.fromisoformat(slot).strftime("%a, %d %b · %I:%M %p"),
                kind="select_slot", doctor_id=str(doctor["id"]), appointment_time=slot, consult_type="telehealth",
            )
            for index, slot in enumerate(slots)
        ]
        return ConversationReply(
            conversation_id=session_id, language=language, state="awaiting_slot", transcript=text or None,
            response=self._copy(language,
                f"I found {doctor['user']['name']}, {doctor['specialty']}. Choose a time that works for you.",
                f"मुझे {doctor['user']['name']} मिले हैं, जो {doctor['specialty']} विशेषज्ञ हैं। अपना सुविधाजनक समय चुनें।",
                f"Mujhe {doctor['user']['name']} mile hain, {doctor['specialty']} specialist. Apne liye suitable time choose karein."),
            actions=actions,
        )


voice_conversation_engine = VoiceConversationEngine()
