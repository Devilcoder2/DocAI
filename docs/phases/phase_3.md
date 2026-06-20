# Phase 3: Telehealth Infrastructure & In-House Bot Recorder

## Sub-Phase 3.1: LiveKit Video Rooms & Consult Interfaces
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

---

## Sub-Phase 3.2: In-House Headless Recording Bot
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

---

## Sub-Phase 3.3: Media Storage & Audio Alignment
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
