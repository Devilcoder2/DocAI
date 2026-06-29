import sys
import httpx
import time

GATEWAY_URL = "http://localhost:8000"

def run_telehealth_e2e_tests():
    print("============================================================")
    print("[TELEHEALTH FEATURE E2E TEST SUITE START]")
    
    timestamp = int(time.time())
    
    # 1. Register Patient A and Patient B
    payload_a = {
        "email": f"patient_a_{timestamp}@example.com",
        "password": "securepassword123",
        "name": "Patient A (Owner)",
        "role": "Patient"
    }
    payload_b = {
        "email": f"patient_b_{timestamp}@example.com",
        "password": "securepassword123",
        "name": "Patient B (Hijacker)",
        "role": "Patient"
    }

    print("[*] Registering test patients...")
    reg_url = f"{GATEWAY_URL}/api/v1/public/auth/register"
    
    try:
        reg_a = httpx.post(reg_url, json=payload_a, timeout=5.0)
        reg_b = httpx.post(reg_url, json=payload_b, timeout=5.0)
    except Exception as e:
        print(f"[FAIL] Gateway not reachable: {e}")
        sys.exit(1)
        
    assert reg_a.status_code in (200, 201)
    assert reg_b.status_code in (200, 201)
    
    token_a = reg_a.json()["token"]
    patient_a_id = reg_a.json()["user"]["id"]
    headers_a = {"Authorization": f"Bearer {token_a}"}
    
    token_b = reg_b.json()["token"]
    patient_b_id = reg_b.json()["user"]["id"]
    headers_b = {"Authorization": f"Bearer {token_b}"}
    
    print(f"[PASS] Patient A ID: {patient_a_id} | Patient B ID: {patient_b_id}")

    # 2. Test Voice Agent Room Token retrieval (GET /api/v1/telehealth/rooms/voice-token)
    print("[*] Scenario 1: Querying conversational voice-agent token for Patient A...")
    voice_token_url = f"{GATEWAY_URL}/api/v1/telehealth/rooms/voice-token"
    voice_token_resp = httpx.get(voice_token_url, headers=headers_a)
    assert voice_token_resp.status_code == 200, f"Voice token request failed: {voice_token_resp.text}"
    voice_data = voice_token_resp.json()
    assert "token" in voice_data, "No signed JWT token returned"
    print(f"[PASS] Voice token generated. Room mapping: {voice_data['room_name']}")

    # 3. Create appointment for Patient A with Dr. Alice Heart
    doctor_id = "04a7568a-05ca-4130-943c-f80371b837d3" # Dr. Alice Heart
    selected_slot = "2026-07-06T11:00:00"
    print(f"[*] Booking consult appointment for Patient A with Dr. Heart for slot {selected_slot}...")
    book_url = f"{GATEWAY_URL}/api/v1/appointments"
    booking_payload = {
        "doctor_id": doctor_id,
        "patient_id": patient_a_id,
        "appointment_time": selected_slot,
        "consult_type": "telehealth",
        "reason_for_visit": "E2E Telehealth room security checks"
    }
    book_resp = httpx.post(book_url, headers=headers_a, json=booking_payload)
    assert book_resp.status_code in (200, 201), f"Booking setup failed: {book_resp.text}"
    appointment_id = book_resp.json()["id"]
    print(f"[PASS] Setup appointment ID: {appointment_id}")

    # 4. Request video room token for Patient A (Allowed)
    print("[*] Scenario 2: Requesting room access token as Patient A (Appointment Owner - Allowed)...")
    token_url = f"{GATEWAY_URL}/api/v1/telehealth/rooms/token"
    token_payload = {"appointment_id": appointment_id}
    
    token_a_resp = httpx.post(token_url, headers=headers_a, json=token_payload)
    assert token_a_resp.status_code == 200, f"Patient A should be allowed: {token_a_resp.text}"
    print(f"[PASS] Patient A successfully authorized. Identity: {token_a_resp.json()['identity']}")

    # 5. Request video room token for Patient B (Denied/Blocked)
    print("[*] Scenario 3: Requesting room access token as Patient B (Hijacker - Gated/Blocked)...")
    token_b_resp = httpx.post(token_url, headers=headers_b, json=token_payload)
    print(f"    Patient B room access try status: {token_b_resp.status_code}")
    assert token_b_resp.status_code == 403, f"Security Breach: Patient B was NOT blocked! Status: {token_b_resp.status_code}"
    print("[PASS] HIPAA access guard successfully blocked unauthorized Patient B.")

    # 6. Request video room token for Doctor (Allowed)
    print("[*] Scenario 4: Requesting room access token as Consulting Doctor (Allowed)...")
    # Log in doctor
    login_url = f"{GATEWAY_URL}/api/v1/public/auth/login"
    doc_login = httpx.post(login_url, json={"email": "alice.heart@medical.com"})
    assert doc_login.status_code == 200
    doc_token = doc_login.json()["token"]
    headers_doc = {"Authorization": f"Bearer {doc_token}"}
    
    token_doc_resp = httpx.post(token_url, headers=headers_doc, json=token_payload)
    assert token_doc_resp.status_code == 200, f"Doctor should be allowed: {token_doc_resp.text}"
    print(f"[PASS] Doctor successfully authorized. Identity: {token_doc_resp.json()['identity']}")

    # 7. Clean up: Delete Patient A, Patient B
    print("[*] Cleaning up E2E test users...")
    del_url = f"{GATEWAY_URL}/api/v1/users/me"
    del_a = httpx.delete(del_url, headers=headers_a)
    del_b = httpx.delete(del_url, headers=headers_b)
    assert del_a.status_code == 204
    assert del_b.status_code == 204
    print("[PASS] E2E cleanup completed.")
    
    print("\n============================================================")
    print("[ALL TELEHEALTH & WEBRTC ROOM INTEGRATION CHECKS PASSED]")
    print("============================================================\n")

if __name__ == "__main__":
    run_telehealth_e2e_tests()
