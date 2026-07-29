import asyncio
import unittest

from app.voice_conversation import VoiceConversationEngine


DOCTOR = {
    "id": "11111111-1111-1111-1111-111111111111",
    "specialty": "Cardiology",
    "clinic_address": "Pune",
    "user": {"name": "Dr. Meera Shah"},
}
SLOT = "2030-01-02T09:00:00"


def engine_with_live_data():
    engine = VoiceConversationEngine()

    async def get(path, **params):
        if path == "/doctors":
            return [DOCTOR]
        if path.endswith("/availability"):
            return [SLOT]
        if path == "/appointments":
            return []
        raise AssertionError(path)

    async def book(patient_id, pending):
        assert patient_id == "patient-1"
        assert pending.doctor_id == DOCTOR["id"]
        return {"appointment_time": pending.appointment_time}

    engine._get = get
    engine._book = book
    return engine


class VoiceConversationTests(unittest.TestCase):
    def test_emergency_ends_conversation_in_india_context(self):
        reply = asyncio.run(engine_with_live_data().respond(patient_id="patient-1", message="Mujhe seene mein dard ho raha hai"))
        self.assertTrue(reply.is_emergency)
        self.assertEqual(reply.state, "ended")
        self.assertIn("112", reply.response)

    def test_hinglish_search_requires_explicit_confirmation_before_booking(self):
        engine = engine_with_live_data()
        search = asyncio.run(engine.respond(patient_id="patient-1", message="mujhe heart doctor chahiye"))
        self.assertEqual(search.language, "hinglish")
        self.assertEqual(search.state, "awaiting_slot")
        chosen = asyncio.run(engine.respond(
            patient_id="patient-1", conversation_id=search.conversation_id,
            action="select_slot", doctor_id=DOCTOR["id"], appointment_time=SLOT,
        ))
        self.assertTrue(chosen.requires_confirmation)
        self.assertEqual(chosen.state, "awaiting_confirmation")
        confirmed = asyncio.run(engine.respond(
            patient_id="patient-1", conversation_id=search.conversation_id,
            action="confirm_booking", message="haan",
        ))
        self.assertIn("confirm", confirmed.response.lower())

    def test_out_of_scope_request_is_refused_without_booking(self):
        reply = asyncio.run(engine_with_live_data().respond(patient_id="patient-1", message="Give me a cake recipe"))
        self.assertIn("cannot help", reply.response.lower())
