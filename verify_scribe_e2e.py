import sys
import httpx
import time

GATEWAY_URL = "http://localhost:8000"

def run_scribe_e2e_tests():
    print("============================================================")
    print("[AMBIENT SCRIBE & SOAP EDITOR E2E TEST SUITE START]")
    
    timestamp = int(time.time())
    
    # 1. Register & Login Patient A
    print("[*] Registering test patient...")
    reg_url = f"{GATEWAY_URL}/api/v1/public/auth/register"
    payload_patient = {
        "email": f"scribe_patient_{timestamp}@example.com",
        "password": "securepassword123",
        "name": "Scribe Patient A",
        "role": "Patient"
    }
    reg_resp = httpx.post(reg_url, json=payload_patient, timeout=5.0)
    assert reg_resp.status_code in (200, 201)
    patient_token = reg_resp.json()["token"]
    patient_id = reg_resp.json()["user"]["id"]
    headers_patient = {"Authorization": f"Bearer {patient_token}"}
    
    # 2. Login Doctor Alice Heart
    print("[*] Logging in physician Dr. Heart...")
    login_url = f"{GATEWAY_URL}/api/v1/public/auth/login"
    doc_login = httpx.post(login_url, json={"email": "alice.heart@medical.com"})
    assert doc_login.status_code == 200
    doc_token = doc_login.json()["token"]
    doctor_id = doc_login.json()["user"]["id"]
    headers_doctor = {"Authorization": f"Bearer {doc_token}"}
    print(f"[PASS] Logged in patient ID: {patient_id} | Doctor ID: {doctor_id}")

    # 3. Book a test appointment
    selected_slot = "2026-07-06T12:00:00"
    print(f"[*] Booking test appointment for slot {selected_slot}...")
    book_url = f"{GATEWAY_URL}/api/v1/appointments"
    booking_payload = {
        "doctor_id": "04a7568a-05ca-4130-943c-f80371b837d3",
        "patient_id": patient_id,
        "appointment_time": selected_slot,
        "consult_type": "telehealth",
        "reason_for_visit": "E2E Ambient Scribe Verification"
    }
    book_resp = httpx.post(book_url, headers=headers_patient, json=booking_payload)
    assert book_resp.status_code in (200, 201), f"Booking failed: {book_resp.text}"
    appointment_id = book_resp.json()["id"]
    print(f"[PASS] Setup appointment ID: {appointment_id}")

    # 4. Scenario 1: Initialize SOAP Note Draft (POST /api/v1/appointments/{id}/clinical-note)
    print("[*] Scenario 1: Initializing clinical note draft as Physician...")
    note_url = f"{GATEWAY_URL}/api/v1/appointments/{appointment_id}/clinical-note"
    note_payload = {
        "appointment_id": appointment_id,
        "raw_transcript": "Doctor: Hello, how are you? Patient: I have had mild chest pain and fatigue for 3 days.",
        "subjective": "Patient reports mild chest pain and fatigue for 3 days.",
        "objective": "Heart rate 72 bpm, blood pressure 120/80 mmHg.",
        "assessment": "Chest pain under evaluation.",
        "plan": "Follow up in 2 days.",
        "patient_summary": "You reported chest pain. Rest and monitor symptoms."
    }
    
    note_init_resp = httpx.post(note_url, headers=headers_doctor, json=note_payload)
    assert note_init_resp.status_code in (200, 201), f"Draft initialization failed: {note_init_resp.text}"
    print(f"[PASS] Clinical note draft successfully created. Status: {note_init_resp.json()['status']}")

    # 5. Scenario 2: Auto-save manual edits as Physician (PUT /api/v1/appointments/{id}/clinical-note)
    print("[*] Scenario 2: Simulating debounced editor auto-save...")
    update_payload = {
        "subjective": "Patient reports mild chest pain and fatigue for 3 days. Denies shortness of breath."
    }
    update_resp = httpx.put(note_url, headers=headers_doctor, json=update_payload)
    assert update_resp.status_code == 200, f"Auto-save update failed: {update_resp.text}"
    assert update_resp.json()["subjective"] == update_payload["subjective"], "Subjective edits mismatch"
    print("[PASS] Editor auto-save changes saved successfully.")

    # 6. Scenario 3: Access Security Gating Check (Patient trying to edit notes - Denied)
    print("[*] Scenario 3: Checking clinical role gating guards (Patient try - Denied)...")
    hack_payload = {
        "subjective": "Patient wants to forge notes."
    }
    hack_resp = httpx.put(note_url, headers=headers_patient, json=hack_payload)
    print(f"    Patient try edit note response status: {hack_resp.status_code}")
    assert hack_resp.status_code == 403, f"Security Breach: Patient was allowed to edit note! Status: {hack_resp.status_code}"
    print("[PASS] Clinician role gate successfully blocked unauthorized patient edit.")

    # 7. Scenario 4: Electronic sign-off and approval (POST /api/v1/appointments/{id}/clinical-note/approve)
    print("[*] Scenario 4: Performing final clinician sign-off (Approve & Lock)...")
    approve_url = f"{GATEWAY_URL}/api/v1/appointments/{appointment_id}/clinical-note/approve"
    approve_resp = httpx.post(approve_url, headers=headers_doctor)
    assert approve_resp.status_code == 200, f"Approve failed: {approve_resp.text}"
    assert approve_resp.json()["status"] == "approved", "Approved status flag missing"
    print("[PASS] Clinical note approved and electronically signed.")

    # 8. Scenario 5: Block updates on approved and locked note
    print("[*] Scenario 5: Verifying modifications are disabled on locked clinical note...")
    locked_update_resp = httpx.put(note_url, headers=headers_doctor, json=update_payload)
    print(f"    Locked note write response status: {locked_update_resp.status_code}")
    assert locked_update_resp.status_code == 400, f"Security check failed: modifications allowed on locked note! Status: {locked_update_resp.status_code}"
    print("[PASS] Approved note lock verified. Modifications are successfully disabled.")

    # 9. Cleanup
    print("[*] Cleaning up test patient records...")
    del_url = f"{GATEWAY_URL}/api/v1/users/me"
    del_resp = httpx.delete(del_url, headers=headers_patient)
    assert del_resp.status_code == 204
    print("[PASS] E2E cleanup completed.")

    print("\n============================================================")
    print("[ALL AMBIENT SCRIBE & SOAP NOTE EDITOR CHECKS PASSED]")
    print("============================================================\n")

if __name__ == "__main__":
    run_scribe_e2e_tests()
