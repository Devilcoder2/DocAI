# Phase 9: Conversational Web Voice AI Agent & Full System UI/UX Light/Dark Theme Revamp

## Sub-Phase 9.1: Conversational Web Voice AI Agent
* **Current Functionality / Progress**:
  * Scribe consumer supports Twilio voice/SMS webhook, but the Patient Portal web app does not have a native web button to interact with the voice bot.
* **Expected Outcome**:
  * A "Talk to Voice Agent" button allows patients to initiate a LiveKit WebRTC audio room session, streaming audio bi-directionally with a LiveKit voice agent worker to search past appointments, check availability, book slots, and answer clinic queries.
* **Definition of Done Checklist**:
  * [ ] Set up LiveKit server endpoint in the Scribe / Telehealth service to dispatch room connection tokens for voice agents.
  * [ ] Integrate a floating microphone button on the Patient Portal using `@livekit/components-react` to join the LiveKit voice room.
  * [ ] Build a LiveKit agent worker script implementing voice triage, calendar slot tool-calling, and out-of-bounds topic rejection.
* **Verification Plan**:
  * Click the Voice Agent icon, verify it establishes WebRTC audio connection to LiveKit, and speak: *"Book me an appointment with the cardiologist next Monday"*. Verify the agent confirms availability and schedules it. Speak an out-of-bounds query (*"Who won the soccer world cup?"*); verify it politely declines to answer.
* **Handoff for Next Phase**:
  * Client LiveKit voice component modules and agent worker configurations.

---

## Sub-Phase 9.2: Default Light-Theme / Dark-Mode Toggle UI/UX Revamp
* **Current Functionality / Progress**:
  * Dark slate colors are hardcoded. Typography uses standard browser defaults.
* **Expected Outcome**:
  * default light theme, Outfit/Inter fonts, rounded card components, hover transitions, and a dark-mode toggle.
* **Definition of Done Checklist**:
  * [ ] Add ThemeProvider dynamic light/dark context wrapper.
  * [ ] Revamp globals.css variables mapping slate base tokens by default.
  * [ ] Redesign booking wizards, search dashboards, Scribe workspaces, and companion panels with Outfit/Inter typography and hover animations.
* **Verification Plan**:
  * Toggle light/dark modes on the dashboard; verify the entire theme adapts instantly without FOUC (flash of unstyled content) and animations transition smoothly.
* **Handoff for Next Phase**:
  * Clean global styles and layout wrappers.
