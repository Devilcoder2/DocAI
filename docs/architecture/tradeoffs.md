# Architectural Tradeoff Decisions
## Project Name: Medical AI Platform (Doctor Booking + AI Clinical Scribe & Companion)

Designing a secure, real-time medical platform requires balances between latency, consistency, operational simplicity, and data safety. Below are the key architectural tradeoffs chosen:

---

### Tradeoff 1: Microservices Architecture vs. Modular Monolith
* **Decision**: Implement a distributed Microservices Architecture where core business operations (Scheduling, Telehealth, AI Scribe, Conversational Agents) run as independent services.
* **Rationale**:
  * **Pros**:
    1. **Compute Resource Isolation**: AI transcription, speaker diarization, and medical summarization processes are highly resource-intensive. Running them as a separate microservice prevents compute bottlenecks from impacting the scheduling and marketplace search portal.
    2. **Fault Domain Separation**: If the AI speech-to-text pipeline experiences a server crash under high volume, patients can still search, book, and cancel appointments without interruption.
    3. **Independent Technology Scaling**: Scribe services can be scaled on nodes optimized for machine learning (GPUs or high-performance CPU configurations), while scheduling resides on standard web containers.
  * **Cons**: Increased deployment overhead and operational complexity. It introduces eventual consistency across service boundaries, which requires using an Event Broker (Message Queue) to coordinate updates.

---

### Tradeoff 2: Server-Side Audio Streaming vs. Client-Side Buffered Audio Uploads
During consultations, we must capture conversational audio. We evaluated streaming audio continuously in real time vs. saving the file locally and uploading it at the end of the session.
* **Decision**: Continuous Server-Side Audio Streaming.
* **Rationale**:
  * **Pros**: High data reliability. If a doctor’s browser crashes, local device battery dies, or connectivity drops mid-session, all audio up to that point is already secured on the server. Processing can begin instantly, reducing post-call compilation delays.
  * **Cons**: Higher server memory overhead and sensitivity to intermittent network drops (requires socket reconnection handlers and jitter buffers). We accept this cost because losing a clinical recording forces the doctor to re-do the consultation manually, ruining user trust.

---

### Tradeoff 3: Asynchronous External EHR Sync vs. Synchronous Write-Through
* **Decision**: Asynchronous synchronization using a durable queue for all external Electronic Health Record (EHR) systems, instead of making the scheduling API wait for external server confirmations.
* **Rationale**:
  * **Pros**: Isolates our system from external downtime. Legacy hospital APIs are notoriously slow and experience frequent outages. An async model ensures our marketplace and booking interface remain operational even if a clinic's internal system goes offline temporarily.
  * **Cons**: Introduces eventual consistency. A slot booked on our platform might take up to a few seconds to register in the doctor's main calendar, creating a very small window for double-booking. We mitigate this by sending a "reservation pending" state and holding the slot locally.

---

### Tradeoff 4: Context Injection with Optimization vs. Standard Retrieval-Augmented Generation (RAG)
For the Post-Visit Care Companion, we evaluated standard database retrieval (RAG) against injecting the full care plan directly. We have chosen an optimized Context Injection approach.
* **Decision**: Context Injection with Sliding Summarization and Selective Segmentation.
* **Rationale**:
  * **Pros**: Eliminates hallucination. Injecting the doctor-signed care plan directly ensures the model is anchored strictly to approved clinical text.
  * **Cons**: If the patient chat runs for dozens of turns, or if the care plan is long, context drift can cause attention dilution in the LLM. 
  * **Optimization Mitigation Strategy**:
    1. **Sliding Context Window with AI Summary Consolidation**: When the dialog history exceeds a set threshold (e.g. 10 messages), a background worker summarizes older messages. This summary is prepended to the current query context, pruning raw messages to keep prompt size small.
    2. **Selective Context Segmentation**: The care plan is segmented into topics (e.g., Medications, Precautions). The system queries and injects only the topic segment relevant to the patient's current question, keeping the prompt focused.
    3. **Dual-Model Guardrail Pipeline**: A small, fast parser extracts structural facts from the plan and hands them to the responder, preventing the responder from searching large volumes of free text and hallucinating directions.

---

### Tradeoff 5: Hybrid State Machine vs. Fully Agentic LLM for Booking Flow
We compared using a flexible AI agent that steers the conversation dynamically against using a strict state machine where the AI merely handles natural language parsing within fixed states.
* **Decision**: Hybrid Model with a Deterministic State Machine.
* **Rationale**:
  * **Pros**: Guarantees safety and sequence. The system forces the booking agent to complete the Emergency Triage check first before it can query calendars. It prevents the AI from skipping intake forms, hallucinating pricing, or agreeing to dates that do not exist.
  * **Cons**: The conversation feels slightly more structured compared to a fully free-form conversational agent. We prioritize safety and regulatory consistency over conversational creativity.
