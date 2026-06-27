# Phase 9: Conversational LiveKit Voice AI Agent

## Sub-Phase 9.1: LiveKit Voice Agent Token Server & Client Hookup
* **Current Functionality / Progress**:
  * Telehealth service generates WebRTC tokens for doctor-patient video rooms, but no endpoint exists to authenticate and route users to a dedicated voice assistant session room.
* **Expected Outcome**:
  * Backend route generating voice agent session tokens. Next.js patient portal includes a floating microphone widget utilizing LiveKit components to connect to the audio channel.
* **Definition of Done Checklist**:
  * [ ] Implement token generation endpoint `GET /rooms/voice-token` in telehealth service issuing LiveKit voice room tokens with audio-only permission claims.
  * [ ] Develop floating `VoiceAssistantButton` widget using `@livekit/components-react` handling microphone access and connecting to the LiveKit server.
  * [ ] Integrate sound-wave CSS animations and state indicators showing connecting, talking, listening, and offline status.
* **Verification Plan**:
  * Click the voice assistant button on the Patient Portal; verify that the console logs successful connection to the LiveKit audio room and visual waves ripple as user speaks.
* **Handoff for Next Sub-Phase**:
  * LiveKit audio room WebRTC endpoint.

---

## Sub-Phase 9.2: LiveKit Voice Agent Worker Core (STT, LLM & TTS Pipeline)
* **Current Functionality / Progress**:
  * No active voice agent runner exists.
* **Expected Outcome**:
  * A stateful Python LiveKit Agent worker connecting to the room, handling speech-to-text transcription, routing to the LLM core, and synthesizing text back to voice audio.
* **Definition of Done Checklist**:
  * [ ] Write `voice_agent_worker.py` utilizing the LiveKit Agents SDK (`livekit-agents`).
  * [ ] Bind STT plugin engine (Deepgram/Whisper) to transcribe incoming patient audio buffers.
  * [ ] Bind TTS synthesis engine (ElevenLabs/Cartesia/EdgeTTS) to generate and play back agent voice frames.
* **Verification Plan**:
  * Run the agent worker process; speak into the web portal microphone and check worker logs to confirm user audio is transcribed and synthesized voice returns.
* **Handoff for Next Sub-Phase**:
  * WebRTC bi-directional audio transcription stream.

---

## Sub-Phase 9.3: Dialogue Rules, Database Tool Callers & Guardrails
* **Current Functionality / Progress**:
  * Voice agent can speak but lacks integration with scheduling APIs or conversation guardrails.
* **Expected Outcome**:
  * Voice agent executing real-time doctor availability checks, slot bookings, past consultation reviews, and rejecting off-topic queries.
* **Definition of Done Checklist**:
  * [ ] Develop database tool callers (`search_doctors`, `check_availability`, `book_appointment`, `summarize_history`) linked to the scheduling microservice.
  * [ ] Write system prompt rules enforcing safety boundaries, triage blocks, and out-of-scope question rejection.
* **Verification Plan**:
  * Ask the voice agent: *"Can I book an appointment with Dr. Alice next Monday?"*. Verify it queries scheduling slots and books the appointment.
  * Ask: *"What is the recipe for chocolate cake?"*. Verify it politely declines to answer.
* **Handoff for Next Phase**:
  * Fully tested conversational LiveKit voice booking agent.
