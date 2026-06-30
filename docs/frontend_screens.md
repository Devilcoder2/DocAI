# Frontend Screens Directory & Single-Unit UX Design

This document catalogs all the frontend screens required for the Medical AI Platform. To ensure a premium, uncluttered user experience (UX) and prevent cognitive overload, each view is designed as a **Single-Unit Screen**—focusing on a single core objective, action, or layout unit at a time.

---

## 1. Authentication & Role Gateway

### Screen 1: Sandbox SSO & Role Gate
* **Route**: `/`
* **Single-Unit Focus**: Credentials login form or single-click Mock OAuth SSO buttons.
* **UX Description**: Renders a centered glassmorphic login card against a theme-responsive background. Zero sidebar navigation or auxiliary info. Users choose a role (Patient or Doctor) and proceed.
* **Core Elements**: 
  - Role toggles (Patient vs. Doctor)
  - Credentials input (Email / Password)
  - Google / Facebook Sandbox SSO buttons

---

## 2. Patient Portal Views

### Screen 2: Welcome Hub & Action Dashboard
* **Route**: `/welcome`
* **Single-Unit Focus**: Action dashboard greeting.
* **UX Description**: The landing hub for authenticated patients. Renders a clean display with a personalized greeting, a notification panel for upcoming consults, and a main action button triggering search workflows.
* **Core Elements**:
  - Personal greeting panel (Outfit Typography)
  - Floating Voice Assistant Microphone drawer toggle
  - Global Light/Dark Theme Switcher

### Screen 3: Doctor Directory Search Grid
* **Route**: `/welcome#search` (or `/doctors`)
* **Single-Unit Focus**: Filterable clinic provider directory search.
* **UX Description**: Focuses entirely on finding medical providers. Shows a clean sidebar for filtering (Specialty, ZIP code) and a list of matching physician cards.
* **Core Elements**:
  - Search inputs (ZIP, Specialty dropdowns)
  - Clean card deck displaying rating, clinic name, and avatar

### Screen 4: Doctor Detailed Profile Card
* **Route**: `/doctors/[id]`
* **Single-Unit Focus**: Provider qualifications and credentials display.
* **UX Description**: Displays the credentials, bio, and clinic location of a single selected doctor. Clutter is minimized by placing slot bookings on a separate wizard view.
* **Core Elements**:
  - Physician profile bio, ratings, and clinics list
  - Primary button: "View Available Booking Slots"

### Screen 5: Calendar Slot Booking Wizard
* **Route**: `/doctors/[id]/book` (or modal panel)
* **Single-Unit Focus**: Calendar schedule date/time target selection.
* **UX Description**: A focused multi-step calendar wizard showing date options and time chips. No other page elements are interactive during booking selection.
* **Core Elements**:
  - Interactive calendar date grid
  - Available time slot chips (9:00 AM - 5:00 PM)
  - Reason for visit text input

### Screen 6: Telehealth Consultation Room (Patient View)
* **Route**: `/appointments/[id]/room`
* **Single-Unit Focus**: Active audio-video consult session.
* **UX Description**: Full-screen layout displaying the doctor's live video stream, with the patient's self-preview in a small corner window. Floating control bars hide automatically when inactive.
* **Core Elements**:
  - High-fidelity WebRTC video/audio feeds
  - Floating call controls (Mic mute, camera toggle, disconnect)

### Screen 7: Care Companion Post-Visit Chat
* **Route**: `/appointments/[id]/companion`
* **Single-Unit Focus**: Post-discharge care guidance chat window.
* **UX Description**: Renders a dedicated messaging view enabling the patient to query the LangGraph AI Companion about their approved care plan.
* **Core Elements**:
  - Clean message feed displaying bot recommendations
  - Action trigger tags (e.g. "Explain my prescriptions", "Dietary limitations")

### Screen 8: Patient EHR Profile Details
* **Route**: `/profile`
* **Single-Unit Focus**: Patient vital constants input form.
* **UX Description**: A clean form configuration containing input fields for patient constants (Age, Gender, Weight, Height) to avoid cluttering registration screens.
* **Core Elements**:
  - Demographic input fields
  - Constants update status indicators

---

## 3. Physician Portal Views

### Screen 9: Doctor Consult Queue Dashboard
* **Route**: `/doctor/dashboard`
* **Single-Unit Focus**: Today's active consultations list queue.
* **UX Description**: Standard workspace list outlining patients checked-in, ongoing calls, and completed SOAP draft notes.
* **Core Elements**:
  - Tabular list of appointments (Patient name, time slot, status)
  - Action button: "Start Call" or "Open Scribe"

### Screen 10: Consult Volume Analytics Charts
* **Route**: `/doctor/dashboard#analytics`
* **Single-Unit Focus**: Visual hourly statistics graphs.
* **UX Description**: Renders frameless analytics charts representing consult stats (Volume per hour, documentation speed averages) without textual table clutter.
* **Core Elements**:
  - Pure-CSS vertical bar chart representing consultation density
  - Statistics overview cards (Today's count, Scribe speed)

### Screen 11: Telehealth Consultation Room (Doctor View)
* **Route**: `/doctor/appointments/[id]/room`
* **Single-Unit Focus**: Active audio-video consult session.
* **UX Description**: Full-screen video console with participant video streams and a single button to launch the AI Scribe documentation workspace.
* **Core Elements**:
  - WebRTC video streams
  - Primary button: "Open Scribe Workspace"

### Screen 12: Scribe Split-Screen Workspace
* **Route**: `/doctor/appointments/[id]/scribe`
* **Single-Unit Focus**: Raw conversational transcript vs. SOAP note textareas.
* **UX Description**: Split-screen Clinical Workspace. Left column displays the transcript timeline with speaker filters; right column contains the editable SOAP fields.
* **Core Elements**:
  - Speaker-labeled transcript feed (Searchable)
  - SOAP textareas (Subjective, Objective, Assessment, Plan) with auto-save
  - Sidebar for Patient EHR Constants / historical appointments timeline

### Screen 13: Lay Translation Patient Summary Display
* **Route**: `/doctor/appointments/[id]/scribe#summary` (or focused view)
* **Single-Unit Focus**: Simplified layman summary card.
* **UX Description**: Renders the AI-translated patient summary in large, legible typography with a single click-to-copy button for printing or emailing care instructions.
* **Core Elements**:
  - Layman translation text area
  - Action buttons: "Copy Summary", "Send to Patient"

### Screen 14: Finalized SOAP Note Archive View
* **Route**: `/doctor/appointments/[id]/scribe#view` (Read-only)
* **Single-Unit Focus**: Approved and locked clinical SOAP note display.
* **UX Description**: Shows approved notes in a locked, read-only template layout, replacing editable textareas with static text boxes to prevent unauthorized edits.
* **Core Elements**:
  - Electronically signed timestamp indicator
  - Static, non-editable SOAP blocks
