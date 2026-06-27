# Phase 8: Patient Medical History, Past Consultations Summary, and Doctor-facing EHR Views

## Sub-Phase 8.1: Historical Appointments Timeline
* **Current Functionality / Progress**:
  * Patients can book appointments but cannot see a chronological history log of their previous consultations.
* **Expected Outcome**:
  * Patient dashboard page displaying a clean timeline of all past appointments.
* **Definition of Done Checklist**:
  * [ ] Create a timeline interface layout displaying all past appointments on the profile page.
  * [ ] Link completed appointments to open historical consult summaries.
  * [ ] Link future appointments to show date/time, doctor name/specialty, and virtual meeting links.
* **Verification Plan**:
  * Log in as a patient; verify you can see the list of past appointments on your dashboard and check their statuses.
* **Handoff for Next Phase**:
  * Structured timeline components and appointment status hooks.

---

## Sub-Phase 8.2: Past Consultation Summary View
* **Current Functionality / Progress**:
  * Approved SOAP notes are only visible to doctors on their split-screen workspaces.
* **Expected Outcome**:
  * A patient-facing past appointment summary displaying a disease summary at the top, discussion bullet points, recommended medicines, and precautions.
* **Definition of Done Checklist**:
  * [ ] Format the consultation view to display the disease summary, discussion bullet points, and recommended medicine list.
  * [ ] Build the precautions and doctor tips checklist section.
* **Verification Plan**:
  * Click on a past completed appointment from the patient dashboard; verify that it loads the correct SOAP note summary in a readable, patient-friendly format.
* **Handoff for Next Phase**:
  * Clean consult summary components.

---

## Sub-Phase 8.3: Doctor-facing EHR & History Sidebar
* **Current Functionality / Progress**:
  * The doctor scribe workspace shows only the current consult transcript and SOAP boxes.
* **Expected Outcome**:
  * Scribe workspace features a patient medical history sidebar displaying patient age, height, weight, gender, allergies, and chronic illnesses, along with a searchable list of past appointments.
* **Definition of Done Checklist**:
  * [ ] Build the patient profile summary card inside the doctor's split-screen layout.
  * [ ] Create a searchable past consultations timeline sidebar drawer.
* **Verification Plan**:
  * Open the Doctor Scribe page; verify the side panel shows the correct patient weight/height and links to past consults.
* **Handoff for Next Phase**:
  * Shared past appointments API.

---

## Sub-Phase 8.4: Booking Notification Service (Emails)
* **Current Functionality / Progress**:
  * No email alerts are sent upon booking confirmation.
* **Expected Outcome**:
  * Mail notifier triggers on booking confirmation, emailing details + meeting link to patient, and patient clinical summary to doctor.
* **Definition of Done Checklist**:
  * [ ] Implement booking email triggers sending confirmation emails.
  * [ ] Format patient emails with booking confirmation and telehealth WebRTC room links.
  * [ ] Format doctor emails with booking confirmation and patient medical files.
* **Verification Plan**:
  * Book an appointment; check the server console output to confirm the notification emails are logged with correct details.
* **Handoff for Next Phase**:
  * Mail dispatcher module.
