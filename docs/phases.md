# Development Phases Plan
## Project Name: Medical AI Platform (Doctor Booking + AI Clinical Scribe & Companion)
**Author:** AI System Architect & Lead Project Manager  
**Version:** 1.0.0  
**Date:** June 20, 2026  

---

## Phase 1: Foundation Setup & Central API Gateway

### Sub-Phase 1.1: Environment & Local Development Setup
* **Current Functionality / Progress**:
  * Project directory `/Users/ramandeepsingh/Developer/Personal Projects/Medical AI` is empty. No code directories or boilerplate repositories exist.
* **Expected Outcome**:
  * Clean development workspace featuring unified environment configurations, root workspace settings, Docker Compose setups for local databases, and Git repositories.
* **Definition of Done Checklist**:
  * [ ] Git repository initialized with a standard `.gitignore` file for Python, Node.js, and environment credentials.
  * [ ] Docker Compose configuration file established, defining local containers for PostgreSQL, Redis, and RabbitMQ.
  * [ ] Environment configuration template file (`.env.example`) populated with database credentials, ports, and placeholder keys.
* **Verification Plan**:
  * Run `docker compose up -d` and verify that PostgreSQL, Redis, and RabbitMQ containers boot successfully and listen on their default ports.
  * Run `docker compose ps` to ensure all database engines remain in a stable, running state.
* **Handoff for Next Phase**:
  * Document all local port bindings (e.g., PostgreSQL on 5432, Redis on 6379, RabbitMQ on 5672) so that subsequent services can locate them immediately.

### Sub-Phase 1.2: API Gateway & Access Control Setup
* **Current Functionality / Progress**:
  * Databases are running locally, but no entry gateway, routing, or credential validation layer exists.
* **Expected Outcome**:
  * A running FastAPI API Gateway that intercepts incoming traffic, parses JWT (JSON Web Tokens), logs transactions to an audit channel, and proxies requests to backend routes.
* **Definition of Done Checklist**:
  * [ ] FastAPI Gateway service repository initialized with basic CORS configurations.
  * [ ] Authorization middleware built, supporting token signature verification and user role extraction.
  * [ ] Logging middleware built, outputting standard audit payloads (who, what, when, resource accessed).
* **Verification Plan**:
  * Issue a request with an invalid/missing authorization token to a protected gateway route; verify it returns an `HTTP 401 Unauthorized` status.
  * Issue a request with a valid mock token; verify it passes through the gateway and registers a line in the console log.
* **Handoff for Next Phase**:
  * Export the local gateway URL (e.g., `http://localhost:8000`) and the expected authorization header schema (`Authorization: Bearer <token>`) for the frontend and services.

---

## Phase 2: Core Booking Marketplace & Scheduling Engine

### Sub-Phase 2.1: Scheduling Microservice & Database Schema
* **Current Functionality / Progress**:
  * Gateway is established, but no actual booking logic, calendar storage, or scheduling tables exist.
* **Expected Outcome**:
  * An independent Scheduling Microservice built in Python + FastAPI with SQLAlchemy. It exposes REST API endpoints to manage doctor profiles, calendar slots, and appointment states.
* **Definition of Done Checklist**:
  * [ ] SQLAlchemy database tables compiled for: Users, Doctors, Appointments, and Schedule Exceptions.
  * [ ] Alembic initialized, and the initial migration script run against the PostgreSQL database.
  * [ ] Endpoints built for: `GET /doctors` (search with filters), `GET /doctors/{id}/availability`, and `POST /appointments` (slot reservation).
  * [ ] Row-locking mechanism implemented on PostgreSQL slots to prevent concurrent double-booking.
* **Verification Plan**:
  * Run automated unit tests performing concurrent booking requests on the same slot; verify that only the first request succeeds (HTTP 201) and subsequent requests are rejected with a lock conflict (HTTP 409).
  * Execute Alembic migration checks: `alembic current` must show the database is in sync with models.
* **Handoff for Next Phase**:
  * Create a mock database seeding script containing 5 doctors with diverse schedules and zip codes to facilitate frontend listing development.

### Sub-Phase 2.2: Patient Search & Booking UI (Web Portal)
* **Current Functionality / Progress**:
  * No user interface exists.
* **Expected Outcome**:
  * A web application built in Next.js containing the Patient Portal landing page, doctor list view with filters, detailed profile views, and a booking wizard.
* **Definition of Done Checklist**:
  * [ ] Search interface built, supporting filtering by specialty, location (ZIP), date, and insurance network.
  * [ ] Profile cards built, displaying ratings, photo, reviews, and a grid of upcoming appointment slots.
  * [ ] Multi-step Booking Wizard built (Reason -> Insurance -> Guest Sign-up -> AI Consent checkboxes -> Confirmation).
* **Verification Plan**:
  * Open the local portal in a browser, type "Cardiologist", select a doctor, complete the booking wizard with test information, and verify that a "Booking Confirmed" dashboard screen is displayed.
  * Validate that the API Gateway receives the correct payload from the client upon wizard submission.
* **Handoff for Next Phase**:
  * Establish a standard styling template (Tailwind configuration, core HSL color values, button component variants) so the Doctor Dashboard portal matches visually.

---

## Phase 3: Telehealth Infrastructure & In-House Bot Recorder

### Sub-Phase 3.1: LiveKit Video Rooms & Consult Interfaces
* **Current Functionality / Progress**:
  * Appointments can be booked, but virtual meetings cannot be launched or attended.
* **Expected Outcome**:
  * Telehealth Microservice that coordinates video rooms, plus WebRTC consult components in both the Patient and Doctor portals.
* **Definition of Done Checklist**:
  * [ ] Telehealth microservice endpoint built to generate LiveKit tokens based on active Appointment IDs.
  * [ ] Patient Video Room interface built, featuring camera, microphone, chat toggle, and an explicit AI Scribe consent banner.
  * [ ] Doctor Video Room interface built, providing a visual indicator of call status and a "Start Scribe" toggle.
* **Verification Plan**:
  * Open two browser windows (one as Patient, one as Doctor), connect to the same appointment URL, and verify that bidirectional video/audio streams connect in under 2 seconds.
  * Verify that toggling off microphone consent instantly notifies the other peer and triggers a call log event.
* **Handoff for Next Phase**:
  * Document the LiveKit room event webhook format (e.g., `room_started`, `participant_joined`, `room_finished`) so the recording bot launcher knows which events to listen to.

### Sub-Phase 3.2: In-House Headless Recording Bot
* **Current Functionality / Progress**:
  * WebRTC call rooms are functional, but calls are not recorded or saved.
* **Expected Outcome**:
  * A Dockerized Python script utilizing Playwright that runs headlessly. When triggered, it logs into the LiveKit call as a silent participant and streams raw media.
* **Definition of Done Checklist**:
  * [ ] Dockerfile written containing Chromium, Playwright dependencies, and our Python bot automation script.
  * [ ] Bot logic written to dynamically join LiveKit rooms, auto-accept peer audio tracks, and record the incoming audio stream to local container memory.
  * [ ] Lifecycle launcher built in the Telehealth Microservice, spinning up container tasks via the Docker SDK.
* **Verification Plan**:
  * Launch a mock LiveKit room, trigger the bot launcher container, and verify in the container logs that the bot successfully logs in, shows up in the room participant list, and detects active peer audio volumes.
* **Handoff for Next Phase**:
  * Export the file storage path structure where the bot outputs raw recorded audio, ensuring the next phase knows where to search for consult files.

### Sub-Phase 3.3: Media Storage & Audio Alignment
* **Current Functionality / Progress**:
  * Bot records local audio in containers, but data is lost when containers terminate and tracks are not merged.
* **Expected Outcome**:
  * Audio synchronization script that runs FFmpeg to align multiple tracks, apply noise gates, and upload the finalized output to Amazon S3.
* **Definition of Done Checklist**:
  * [ ] FFmpeg subprocess script written to merge separate doctor and patient audio channels into a synchronized dual-channel WAV file.
  * [ ] AWS SDK integration built, uploading the merged audio files to Amazon S3 with AES-256 server-side encryption.
  * [ ] Telehealth service configured to emit a `Session Ended` event to RabbitMQ containing the S3 file reference URL.
* **Verification Plan**:
  * Run a test recording containing delayed track inputs, verify the FFmpeg script outputs a single WAV file with aligned tracks, and confirm the file is visible and readable inside the Amazon S3 test bucket.
* **Handoff for Next Phase**:
  * Establish the standard JSON payload schema for the `Session Ended` event (containing `appointment_id`, `s3_audio_path`, and `duration_seconds`) for the AI Scribe queue consumer.

---

## Phase 4: AI Clinical Scribe Pipeline & Doctor Portal Approval

### Sub-Phase 4.1: Transcription & Speaker Diarization
* **Current Functionality / Progress**:
  * Audio files are saved to S3 and events are published, but no transcription is performed.
* **Expected Outcome**:
  * Scribe Service queue consumer that pulls S3 audio files, runs speaker separation (diarization), and transcribes the speech.
* **Definition of Done Checklist**:
  * [ ] RabbitMQ event listener built in Python, polling for `Session Ended` events.
  * [ ] Faster-Whisper / vLLM speech-to-text pipeline initialized, pulling and transcribing WAV files.
  * [ ] PyAnnote.audio diarization script integrated, separating tracks into timestamped sections labeled "Doctor" and "Patient".
* **Verification Plan**:
  * Submit a test consultation audio file containing conversational overlays; verify that the output text separates doctor questions from patient symptom descriptions with over 90% word accuracy.
* **Handoff for Next Phase**:
  * Define the structured Python dataclass template for the Raw Transcript Output (containing timestamps, speaker tags, and text) to pass to the SOAP note structuring prompt.

### Sub-Phase 4.2: SOAP Clinical Note Synthesizer
* **Current Functionality / Progress**:
  * Raw diarized text transcripts are produced, but they are unstructured and not in clinical format.
* **Expected Outcome**:
  * LLM extraction module utilizing Amazon Bedrock (Claude 3.5 Sonnet) that reads the transcript and writes a structured SOAP note.
* **Definition of Done Checklist**:
  * [ ] LlamaIndex/LangChain prompt template configured, defining SOAP schemas and rules (e.g. translating colloquial terms to medical equivalents).
  * [ ] Structured JSON output validation built, ensuring the model returns the four mandatory sections: Subjective, Objective, Assessment, and Plan.
  * [ ] Patient-friendly summary parser built, translating medical directives into a simple format for the patient.
* **Verification Plan**:
  * Run mock transcripts through the Bedrock execution function; verify the output is formatted as a valid JSON object matching the exact SOAP schema and containing no text hallucinations.
* **Handoff for Next Phase**:
  * Write a database seeder script containing 3 draft notes and their raw transcripts, allowing the frontend developer to test the Scribe Workspace interface.

### Sub-Phase 4.3: Doctor Scribe Workspace UI
* **Current Functionality / Progress**:
  * Draft notes are generated in the database, but doctors have no interface to edit, approve, or sign them.
* **Expected Outcome**:
  * Web-based Workspace UI for doctors featuring a split-screen layout (transcript on the left, editable SOAP sections on the right) and approval controls.
* **Definition of Done Checklist**:
  * [ ] Doctor Dashboard Patient Queue view built, displaying checking statuses and a list of pending approvals.
  * [ ] Split-Screen Workspace built, displaying the editable text fields for SOAP sections and a keyword-searchable transcript.
  * [ ] "Approve & Sign" electronic signature button built, triggering document lock and emitting a `Note Approved` event.
* **Verification Plan**:
  * Log into the Doctor Portal, select a pending consult, make minor text edits in the "Assessment" block, click "Approve & Sign", and confirm that the record state switches to `completed` in the database.
* **Handoff for Next Phase**:
  * Define the payload format for the `Note Approved` event (containing `appointment_id`, `patient_id`, `approved_plan`, and `medications_list`) to initialize the Care Companion database entries.

---

## Phase 5: Post-Visit Care Companion & Booking Agent

### Sub-Phase 5.1: Care Companion Agent Engine (Stateful RAG)
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

### Sub-Phase 5.2: Care Companion Context Window Optimization
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

### Sub-Phase 5.3: Conversational AI Booking Agent
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

---

## Phase 6: Future Capabilities Integration (Phase 2 Roadmap)

### Sub-Phase 6.1: Vision-Based Insurance Card Parser
* **Current Functionality / Progress**:
  * Insurance card data must be keyed manually by patients.
* **Expected Outcome**:
  * An image parsing pipeline that takes front/back card photos, runs vision extraction, and auto-fills registration schemas.
* **Definition of Done Checklist**:
  * [ ] Camera upload interface built in the Patient Portal Booking Wizard.
  * [ ] Amazon Textract / AWS Bedrock Vision script built, extracting Member ID, Group, Carrier, and Copays from images.
  * [ ] Auto-population UI component integrated into the registration form.
* **Verification Plan**:
  * Upload a mock insurance card PNG/JPEG; verify the extracted text fields populate the input fields with 100% spelling accuracy.

### Sub-Phase 6.2: Conversational Pre-Visit Intake Chatbot
* **Current Functionality / Progress**:
  * Standard text dropdowns and textareas handle pre-visit reason intakes.
* **Expected Outcome**:
  * Pre-visit conversational intake bot that interviews patients prior to the consult and writes a structured summary for the doctor.
* **Definition of Done Checklist**:
  * [ ] Pre-visit checklist button added to Patient Dashboard.
  * [ ] Conversational interview loop built, collecting pain points, duration, history, and current medications.
  * [ ] Intake formatting compiler built, writing summary files to the Scribe database.
* **Verification Plan**:
  * Perform the intake chat as a test patient; verify the doctor portal displays the compiled intake note under the active patient details pane.

### Sub-Phase 6.3: Practice Predictive Analytics
* **Current Functionality / Progress**:
  * Doctor calendar has no analytics dashboard.
* **Expected Outcome**:
  * No-show predictor model dashboard analyzing schedule histories and predicting slot cancellation risks.
* **Definition of Done Checklist**:
  * [ ] Analytics tab built in the Doctor Portal.
  * [ ] Predictive inference function built, analyzing slot details (patient history, appointment time, distance) and calculating no-show probabilities.
  * [ ] Visual alert flags integrated into the clinic's patient roster list.
* **Verification Plan**:
  * Access the daily schedule view; check if appointments are flagged with no-show probability indicators (High, Medium, Low) and matching tooltips.
