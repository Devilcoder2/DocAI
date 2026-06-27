# Phase 9: Conversational Web Voice AI Agent & Full System UI/UX Light/Dark Theme Revamp

## Sub-Phase 9.1: Conversational Web Voice AI Agent
* **Current Functionality / Progress**:
  * Scribe consumer supports Twilio voice/SMS webhook, but the Patient Portal web app does not have a native web button to interact with the voice bot.
* **Expected Outcome**:
  * A "Talk to Voice Agent" button allows patients to initiate a microphone session, asking the voice agent to search past appointments, check availability, book slots, and general questions.
* **Definition of Done Checklist**:
  * [ ] Create a web voice agent API endpoint in the Scribe service.
  * [ ] Integrate a floating microphone button on the Patient Portal.
  * [ ] Program voice booking tools and pre-visit intake checks.
* **Verification Plan**:
  * Click the Voice Agent icon, grant microphone permissions, and say *"When was my last appointment?"*. Verify the synthesized audio response returns the correct summary.
* **Handoff for Next Phase**:
  * Client microphone capture components.

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
