import sys
import httpx
import time

GATEWAY_URL = "http://localhost:8000"

def run_master_e2e_pipeline():
    print("======================================================================")
    print("[MASTER PLATFORM INTEGRATION & E2E QUALITY PIPELINE RUN]")
    print("======================================================================\n")

    timestamp = int(time.time())
    
    # -------------------------------------------------------------
    # 1. USER AUTHENTICATION & ACCESS GATING
    # -------------------------------------------------------------
    print("[STAGE 1: Authentication & Access Gating]")
    reg_url = f"{GATEWAY_URL}/api/v1/public/auth/register"
    payload_patient = {
        "email": f"master_e2e_{timestamp}@example.com",
        "password": "strongPassword123",
        "name": "Master E2E Patient",
        "role": "Patient"
    }
    
    try:
        reg_resp = httpx.post(reg_url, json=payload_patient, timeout=5.0)
    except Exception as e:
        print(f"[FAIL] Gateway is not reachable at {GATEWAY_URL}: {e}")
        sys.exit(1)
        
    assert reg_resp.status_code in (200, 201), f"Reg failed: {reg_resp.text}"
    patient_token = reg_resp.json()["token"]
    patient_id = reg_resp.json()["user"]["id"]
    headers_patient = {"Authorization": f"Bearer {patient_token}"}
    print(f"  [PASS] Registered Test Patient ID: {patient_id}")
    
    # Check unauthorized EHR lookup role guard block
    ehr_url = f"{GATEWAY_URL}/api/v1/users/23ab1b50-7f60-46ee-a76a-0cd5eb1bf492"
    ehr_resp = httpx.get(ehr_url, headers=headers_patient)
    assert ehr_resp.status_code == 403, f"Security Breach: Patient was not role gated! Status: {ehr_resp.status_code}"
    print("  [PASS] Gated route protection verified (unauthorized EHR lookup returned 403).")
    print("-" * 70)

    # -------------------------------------------------------------
    # 2. PROVIDER MARKETPLACE & SLOT SEARCH
    # -------------------------------------------------------------
    print("[STAGE 2: Provider Marketplace & Search]")
    search_url = f"{GATEWAY_URL}/api/v1/public/doctors"
    search_resp = httpx.get(search_url, params={"specialty": "Cardiologist"})
    assert search_resp.status_code == 200
    doctors = search_resp.json()
    assert len(doctors) > 0, "No Cardiologists found"
    doctor = doctors[0]
    doctor_id = doctor["id"]
    print(f"  [PASS] Found physician Dr. {doctor['user']['name']} ({doctor['specialty']}) | ID: {doctor_id}")
    
    target_date = "2026-07-06"
    avail_url = f"{GATEWAY_URL}/api/v1/public/doctors/{doctor_id}/availability"
    avail_resp = httpx.get(avail_url, params={"date": target_date})
    assert avail_resp.status_code == 200
    slots = [s for s in avail_resp.json() if "12:00" not in s and "09:00" not in s and "11:00" not in s and "09:30" not in s]
    assert len(slots) > 0, "No open slots remaining"
    selected_slot = slots[0]
    print(f"  [PASS] Queried slots. Selected availability: {selected_slot}")
    print("-" * 70)

    # -------------------------------------------------------------
    # 3. APPOINTMENT BOOKING CHECKOUT
    # -------------------------------------------------------------
    print("[STAGE 3: Appointment Booking checkout]")
    book_url = f"{GATEWAY_URL}/api/v1/appointments"
    booking_payload = {
        "doctor_id": doctor_id,
        "patient_id": patient_id,
        "appointment_time": selected_slot,
        "consult_type": "telehealth",
        "reason_for_visit": "Master E2E pipeline run validations"
    }
    book_resp = httpx.post(book_url, headers=headers_patient, json=booking_payload)
    assert book_resp.status_code in (200, 201), f"Booking check failed: {book_resp.text}"
    appointment_id = book_resp.json()["id"]
    print(f"  [PASS] Appointment successfully booked! ID: {appointment_id}")
    
    # Verify slot double-booking block
    conflict_resp = httpx.post(book_url, headers=headers_patient, json=booking_payload)
    assert conflict_resp.status_code in (400, 409), f"Duplicate booking allowed! Status: {conflict_resp.status_code}"
    print(f"  [PASS] Concurrency block verified (duplicate booking rejected with {conflict_resp.status_code}).")
    print("-" * 70)

    # -------------------------------------------------------------
    # 4. TELEHEALTH ROOM CONNECTION & HIPAA GATES
    # -------------------------------------------------------------
    print("[STAGE 4: Telehealth Access & HIPAA Guards]")
    token_url = f"{GATEWAY_URL}/api/v1/telehealth/rooms/token"
    token_payload = {"appointment_id": appointment_id}
    
    # Authorized Patient Token
    token_a_resp = httpx.post(token_url, headers=headers_patient, json=token_payload)
    assert token_a_resp.status_code == 200
    print(f"  [PASS] Authorized patient room token granted. Identity: {token_a_resp.json()['identity']}")
    
    # Unauthorized Hijacker Token
    payload_b = {
        "email": f"master_hijacker_{timestamp}@example.com",
        "password": "securepassword123",
        "name": "Master Hijacker",
        "role": "Patient"
    }
    reg_b = httpx.post(reg_url, json=payload_b)
    assert reg_b.status_code in (200, 201)
    token_b = reg_b.json()["token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}
    
    token_b_resp = httpx.post(token_url, headers=headers_b, json=token_payload)
    assert token_b_resp.status_code == 403, f"Security Breach: Room hijack allowed! Status: {token_b_resp.status_code}"
    print("  [PASS] HIPAA guard verified (hijacker room request blocked with 403).")
    print("-" * 70)

    # -------------------------------------------------------------
    # 5. AI CONVERSATIONAL ASSISTANT & SAFETY TRIAGE
    # -------------------------------------------------------------
    print("[STAGE 5: Conversational Voice AI & Safety Triage]")
    chat_url = f"{GATEWAY_URL}/api/v1/agent/chat"
    
    # 5a. Welcome Greeting
    greet_resp = httpx.post(chat_url, headers=headers_patient, json={"message": "Hi, hello!"})
    assert greet_resp.status_code == 200
    assert "booking assistant" in greet_resp.json()["response"].lower()
    print("  [PASS] Conversational greeting flow verified.")
    
    # 5b. Out-of-Scope Blocker
    block_resp = httpx.post(chat_url, headers=headers_patient, json={"message": "write python code"})
    assert "out-of-scope" in block_resp.json()["response"].lower() or "cannot answer" in block_resp.json()["response"].lower()
    print("  [PASS] Out-of-scope question blocker verified.")
    
    # 5c. Emergency Safety Warning Triage
    er_resp = httpx.post(chat_url, headers=headers_patient, json={"message": "I have severe chest pain and arm pain."})
    assert er_resp.status_code == 200
    assert er_resp.json()["is_emergency"] == True
    assert "9 1 1" in er_resp.json()["response"] or "911" in er_resp.json()["response"]
    print("  [PASS] Emergency safety triage warning checks verified.")
    print("-" * 70)

    # -------------------------------------------------------------
    # 6. SOAP CLINICAL NOTE EDITOR & LOCKING SIGN-OFF
    # -------------------------------------------------------------
    print("[STAGE 6: SOAP Note Editor & Electronic Sign-off]")
    login_url = f"{GATEWAY_URL}/api/v1/public/auth/login"
    doc_login = httpx.post(login_url, json={"email": "alice.heart@medical.com"})
    assert doc_login.status_code == 200
    doc_token = doc_login.json()["token"]
    headers_doctor = {"Authorization": f"Bearer {doc_token}"}
    
    # 6a. Initialize note
    note_url = f"{GATEWAY_URL}/api/v1/appointments/{appointment_id}/clinical-note"
    note_payload = {
        "appointment_id": appointment_id,
        "raw_transcript": "Patient details chest pain.",
        "subjective": "Chest pain details.",
        "objective": "BP 120/80.",
        "assessment": "Under evaluation.",
        "plan": "Follow up.",
        "patient_summary": "Summary details."
    }
    note_init = httpx.post(note_url, headers=headers_doctor, json=note_payload)
    assert note_init.status_code in (200, 201), f"Initialization failed: {note_init.text}"
    print("  [PASS] Clinical SOAP draft successfully initialized.")
    
    # 6b. Auto-save edits
    update_payload = {"subjective": "Chest pain details. Denies arm pain."}
    update_resp = httpx.put(note_url, headers=headers_doctor, json=update_payload)
    assert update_resp.status_code == 200
    assert update_resp.json()["subjective"] == update_payload["subjective"]
    print("  [PASS] Editor draft auto-save verified.")
    
    # 6c. Role gate edit check
    hack_resp = httpx.put(note_url, headers=headers_patient, json=update_payload)
    assert hack_resp.status_code == 403
    print("  [PASS] SOAP write access clinician role gate verified.")
    
    # 6d. Electronic Sign-off lock
    approve_url = f"{GATEWAY_URL}/api/v1/appointments/{appointment_id}/clinical-note/approve"
    approve_resp = httpx.post(approve_url, headers=headers_doctor)
    assert approve_resp.status_code == 200
    assert approve_resp.json()["status"] == "approved"
    print("  [PASS] SOAP note signed and approved.")
    
    # 6e. Modification block on approved note
    locked_resp = httpx.put(note_url, headers=headers_doctor, json=update_payload)
    assert locked_resp.status_code == 400
    print("  [PASS] SOAP draft write-lock controls verified.")
    print("-" * 70)

    # -------------------------------------------------------------
    # 7. CLEANUP
    # -------------------------------------------------------------
    print("[STAGE 7: Cleanup E2E Test Users]")
    del_url = f"{GATEWAY_URL}/api/v1/users/me"
    del_a = httpx.delete(del_url, headers=headers_patient)
    del_b = httpx.delete(del_url, headers=headers_b)
    assert del_a.status_code == 204
    assert del_b.status_code == 204
    print("  [PASS] E2E cleanup completed successfully.")
    
    print("\n======================================================================")
    print("[ALL STAGES PASSED: MASTER PLATFORM E2E VALIDATION SUCCESSFUL]")
    print("======================================================================\n")

if __name__ == "__main__":
    run_master_e2e_pipeline()
