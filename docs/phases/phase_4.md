# Phase 4: AI Clinical Scribe Pipeline & Doctor Portal Approval

## Sub-Phase 4.1: Transcription & Speaker Diarization
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

---

## Sub-Phase 4.2: SOAP Clinical Note Synthesizer
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

---

## Sub-Phase 4.3: Doctor Scribe Workspace UI
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
