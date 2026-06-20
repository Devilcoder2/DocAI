# Phase 6: Future Capabilities Integration (Roadmap)

## Sub-Phase 6.1: Vision-Based Insurance Card Parser
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

---

## Sub-Phase 6.2: Conversational Pre-Visit Patient Intake
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

---

## Sub-Phase 6.3: Practice Predictive Analytics
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
