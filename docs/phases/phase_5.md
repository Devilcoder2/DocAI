# Phase 5: Post-Visit AI Care Companion & Conversational Booking Agent

## Sub-Phase 5.1: Care Companion Agent Engine (Stateful RAG)
* **Current Functionality / Progress**:
  * Care plans are approved and saved, but the patient has no way to interact with them or receive notifications.
* **Expected Outcome**:
  * Stateful conversational agent using LangGraph and Qdrant vector database that answers questions about the patient's specific care plan.
* **Definition of Done Checklist**:
  * [ ] Qdrant indexing script built, vectorizing approved care plans upon receipt of `Note Approved` events.
  * [ ] LangGraph chat flow built, loading the active plan as a read-only system prompt.
  * [ ] Boundary filter rules defined, preventing the AI from answering general health questions or prescribing new drugs.
* **Verification Plan**:
  * Open the Patient Portal chat companion, ask *"How many pills of Amoxicillin should I take?"*; verify it extracts the exact dosage from the plan. Ask *"Can you diagnose my new headache?"*; verify it refuses to answer and triggers the escalation protocol.
* **Handoff for Next Phase**:
  * Export the WebSocket chat endpoint URL (e.g., `ws://localhost:8003/companion`) to integrate the chat interface widget on the frontend.

---

## Sub-Phase 5.2: Care Companion Context Window Optimization
* **Current Functionality / Progress**:
  * Companion agent works, but long conversations will exceed LLM context constraints and cause hallucinations.
* **Expected Outcome**:
  * Prompt optimization pipelines that prune chat histories and selectively inject sections of the care plan.
* **Definition of Done Checklist**:
  * [ ] Chat History Compressor built, summarizing dialogue when turns exceed 8 messages.
  * [ ] Selective Context Segmenter built, chunking the care plan and injecting only the matching topic segment.
  * [ ] Dual-Model Fact Verifier built, parsing structural facts before passing them to the responder.
* **Verification Plan**:
  * Simulate a 40-turn chat history; verify that the total tokens sent in the LLM request remains below a fixed threshold (e.g., 4000 tokens) and the bot continues to retrieve plan details accurately.
* **Handoff for Next Phase**:
  * Document optimization parameters (e.g., max token boundaries, history summary threshold length) in the project documentation.

---

## Sub-Phase 5.3: Conversational AI Booking Agent
* **Current Functionality / Progress**:
  * No booking assistant exists. Appointments must be scheduled manually via the portal.
* **Expected Outcome**:
  * An AI Scheduling Agent accessible via text (SMS/web chat) and voice (Twilio) that screens for emergencies, searches availability, and books appointments.
* **Definition of Done Checklist**:
  * [ ] Twilio Webhook integrations built, capturing SMS and voice payloads.
  * [ ] Deterministic Triage state machine built, routing patients with chest pain or breathing issues to emergency messages.
  * [ ] Tool-calling functions written, linking the LLM agent to the Scheduling Service database (availability lookups, slot locks, and booking).
* **Verification Plan**:
  * Call the Twilio test phone number; speak to the voice bot. Say *"I need to book an annual physical."* Verify it asks for name, DOB, insurance, checks calendar slots, offers times, and successfully records a booking.
  * Say *"I have severe chest pain."* Verify it immediately stops booking, tells you to call 911, and hangs up.
* **Handoff for Next Phase**:
  * Document all Twilio webhook secret values and system environment configurations.
