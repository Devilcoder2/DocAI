# Phase 9: Conversational LiveKit Voice AI Agent

## Sub-Phase 9.1: LiveKit Voice Agent Token Server & Client Hookup
* **Current Functionality / Progress**:
  * Telehealth service generates WebRTC tokens for doctor-patient video rooms, but no endpoint exists to authenticate and route users to a dedicated voice assistant session room.
* **Expected Outcome**:
  * Telehealth microservice exposes `GET /rooms/voice-token` (proxied at Gateway `/api/v1/telehealth/rooms/voice-token`) signing audio-only tokens for the room `voice_session_{user_id}`.
  * Next.js patient portal includes a floating microphone widget utilizing LiveKit components or falling back to browser-level speech synthesis.
* **Definition of Done Checklist**:
  * [ ] Implement token generation endpoint `GET /rooms/voice-token` in telehealth service issuing LiveKit voice room tokens with audio-only permission claims.
  * [ ] Add `/api/v1/telehealth/rooms/voice-token` proxy route to API Gateway.
  * [ ] Develop floating `VoiceAssistantButton` widget using `@livekit/components-react` handling microphone access and connecting to the LiveKit server.
  * [ ] Integrate sound-wave CSS visualizer animations and state indicators showing connecting, talking, listening, and offline status.
  * [ ] Implement **Browser Web Speech fallback mode** utilizing HTML5 Speech Recognition and Web Speech Synthesis APIs inside the client if the LiveKit server is unreachable/offline, connecting to our backend agent endpoint.
* **Verification Plan**:
  * Click the voice assistant button on the Patient Portal; verify that if LiveKit is up, it joins the audio room. If LiveKit is down, verify it boots the Browser Web Speech Simulator fall-back cleanly and visual waves ripple.
* **Handoff for Next Sub-Phase**:
  * LiveKit audio room WebRTC endpoint & fallback chat endpoint.

---

## Sub-Phase 9.2: LiveKit Voice Agent Worker Core (STT, LLM & TTS Pipeline)
* **Current Functionality / Progress**:
  * No active voice agent runner exists.
* **Expected Outcome**:
  * A stateful Python LiveKit Agent worker connecting to the room, handling speech-to-text transcription, routing to the LLM core, and synthesizing text back to voice audio.
* **Definition of Done Checklist**:
  * [ ] Write `voice_agent_worker.py` utilizing the LiveKit Agents SDK (`livekit-agents`).
  * [ ] Bind STT plugin engine (Deepgram/Whisper) to transcribe incoming patient audio buffers.
  * [ ] Bind TTS synthesis engine (ElevenLabs/OpenAI TTS) to generate and play back agent voice frames, falling back to free Edge-TTS.
  * [ ] Expose an HTTP `/api/v1/agent/chat` conversational endpoint on the Scribe/Agent service to drive LLM responses for the browser speech fallback simulator.
* **Verification Plan**:
  * Run the agent worker process; speak into the web portal microphone and check worker logs to confirm user audio is transcribed and synthesized voice returns.
* **Handoff for Next Sub-Phase**:
  * WebRTC bi-directional audio transcription stream & fallback HTTP chat handler.

---

## Sub-Phase 9.3: Dialogue Rules, Database Tool Callers & Guardrails
* **Current Functionality / Progress**:
  * Voice agent can speak but lacks integration with scheduling APIs or conversation guardrails.
* **Expected Outcome**:
  * Voice agent executing real-time doctor availability checks, slot bookings, past consultation reviews, and rejecting off-topic queries.
* **Definition of Done Checklist**:
  * [ ] Develop database tool callers (`search_doctors`, `check_availability`, `book_appointment`, `summarize_history`) linked to the scheduling microservice.
  * [ ] Write system prompt rules enforcing safety boundaries, triage blocks, and out-of-scope question rejection.
  * [ ] **Emergency Triage Check**: If patient mentions red-flag symptoms (chest pain, shortness of breath, etc.), immediately warning user to call 911 and simply hang up/close the session.
  * [ ] **Out-of-Scope Block**: Refuse queries unrelated to booking, scheduling, or past consultations (e.g. recipes, programming).
* **Verification Plan**:
  * Ask the voice agent: *"Can I book an appointment with Dr. Alice next Monday?"*. Verify it queries scheduling slots and books the appointment.
  * Ask: *"I have chest pain."*. Verify it warns to call 911 immediately and simply hangs up/closes the session.
  * Ask: *"What is the recipe for chocolate cake?"*. Verify it politely declines to answer.
* **Handoff for Next Phase**:
  * Fully tested conversational LiveKit voice booking agent.
