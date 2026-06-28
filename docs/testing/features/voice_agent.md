# Feature Test Specifications - Conversational Voice AI & Triage

This document lists test scenarios, validation steps, and progress logs for the real-time voice agent and conversational safety guardrails.

---

## Scenarios to Test

### 1. Welcome Greeting & Chat Navigation
* **What to Test**: Initializing dialogue via voice input or HTTP fallback chat.
* **How to Verify**:
  * Response introduces the booking assistant.
  * Suggests search actions or appointment dates.

### 2. LiveKit Real-Time Agent Connection
* **What to Test**: Toggling the microphone button to start a WebRTC voice session.
* **How to Verify**:
  * Sound-wave visualizer moves.
  * TTS (ElevenLabs/OpenAI) synthesizes audio responses matching LLM replies.

### 3. Emergency Triage Guardrails
* **What to Test**: User says emergency keywords (*"chest pain"*, *"short of breath"*).
* **How to Verify**:
  * Response raises the emergency flag (`is_emergency: true`).
  * Issues warning: *"Please call 911 immediately or go to the nearest ER. We cannot book appointments for emergency conditions."*
  * Hanging up the session: closes the microphone drawer immediately.

### 4. Out-of-Scope Blocker
* **What to Test**: User asks off-topic prompts (*"how do I make chocolate cake?"*, *"write a python script"*).
* **How to Verify**:
  * Agent declines politely, stating boundaries: *"I am configured to assist only with clinic bookings, doctor directories, and appointment scheduling."*

### 5. Past Consultations History Summary
* **What to Test**: User says: *"summarize my medical history"*.
* **How to Verify**:
  * Agent queries scheduling service for patient past consults list.
  * Formulates a chronological conversational summary of recent visits.

---

## Testing Progress Tracker

| Scenario | Mode | Status | Bugs Found | Notes |
|---|---|---|---|---|
| Welcome greeting | Integration | `[ ] Pending` | None | Verify greeting content |
| Triage trigger | Integration | `[ ] Pending` | None | Check for 911 warning |
| Hang up session | E2E | `[ ] Pending` | None | Verify drawer closes on client |
| Out of scope block | Integration | `[ ] Pending` | None | Refuses cake/recipes |
| History summary | Integration | `[ ] Pending` | None | Pulls database timeline |
