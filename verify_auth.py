import sys
import httpx

GATEWAY_URL = "http://localhost:8000"

def test_auth_and_gating():
    print("============================================================")
    print("[AUTH FEATURE TEST SUITE START]")
    
    import time
    timestamp = int(time.time())
    # Payload for a new test user
    payload_patient = {
        "email": f"auth_test_patient_{timestamp}@example.com",
        "password": "strongPassword123",
        "name": "Auth Test Patient",
        "role": "Patient"
    }

    # 1. Register test patient
    print("[*] Scenario 1: Registering test patient...")
    reg_url = f"{GATEWAY_URL}/api/v1/public/auth/register"
    try:
        reg_resp = httpx.post(reg_url, json=payload_patient, timeout=5.0)
    except Exception as e:
        print(f"[FAIL] Gateway is not reachable at {GATEWAY_URL}: {e}")
        sys.exit(1)
        
    if reg_resp.status_code not in (200, 201):
        print(f"[FAIL] Registration failed: {reg_resp.text}")
        sys.exit(1)
    
    reg_data = reg_resp.json()
    assert "token" in reg_data, "No auth token in registration response"
    assert reg_data["user"]["email"] == payload_patient["email"], "Registered email mismatch"
    print("[PASS] Registration successful.")

    # 2. Login test patient
    print("[*] Scenario 2: Authenticating credentials...")
    login_url = f"{GATEWAY_URL}/api/v1/public/auth/login"
    login_resp = httpx.post(login_url, json={
        "email": payload_patient["email"],
        "password": payload_patient["password"]
    })
    if login_resp.status_code != 200:
        print(f"[FAIL] Login failed: {login_resp.text}")
        sys.exit(1)
        
    login_data = login_resp.json()
    token = login_data["token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] Credentials authentication verified.")

    # 3. Sandbox SSO login paths
    print("[*] Scenario 3: Checking Mock Sandbox SSO routes...")
    sso_url = f"{GATEWAY_URL}/api/v1/public/auth/login"
    
    # 3a. Patient Mock SSO
    sso_patient_resp = httpx.post(sso_url, json={"email": "john.doe@email.com"})
    assert sso_patient_resp.status_code == 200, "Patient mock SSO failed"
    assert sso_patient_resp.json()["user"]["name"] == "John Doe", "Mock patient profile mismatch"
    
    # 3b. Physician Mock SSO
    sso_doctor_resp = httpx.post(sso_url, json={"email": "alice.heart@medical.com"})
    assert sso_doctor_resp.status_code == 200, "Doctor mock SSO failed"
    assert sso_doctor_resp.json()["user"]["role"] == "Doctor", "Mock doctor role mismatch"
    print("[PASS] Sandbox mock SSO routes validated.")

    # 4. Role Gating & Clinical EHR lookup protection
    print("[*] Scenario 4: Verifying role gating security controls...")
    
    # Attempting to fetch another patient clinical profile with patient's token
    other_patient_id = "23ab1b50-7f60-46ee-a76a-0cd5eb1bf492"
    ehr_url = f"{GATEWAY_URL}/api/v1/users/{other_patient_id}"
    
    ehr_resp = httpx.get(ehr_url, headers=headers)
    
    # Since only physicians are allowed to view EHR profiles, a patient's token must be rejected with 401 or 403
    print(f"    Patient role access try status code: {ehr_resp.status_code}")
    assert ehr_resp.status_code in (401, 403), "Security violation: Patient was able to fetch EHR profile!"
    print("[PASS] Role gating guards verified.")

    # 5. Clean up test patient
    print("[*] Cleaning up test patient records...")
    del_url = f"{GATEWAY_URL}/api/v1/users/me"
    del_resp = httpx.delete(del_url, headers=headers)
    assert del_resp.status_code == 204
    print("[PASS] Test cleanup complete.")
    
    print("\n============================================================")
    print("[ALL AUTHENTICATION INTEGRATION CHECKS PASSED SUCCESSFULLY]")
    print("============================================================\n")

if __name__ == "__main__":
    test_auth_and_gating()
