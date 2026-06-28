import sys
import httpx

def run_e2e_checks():
    print("============================================================\n[PHASE 9.3 E2E VERIFICATION SUITE START]")
    
    # 1. Register and login test patient
    login_payload = {
        "email": "e2e_voice_verify@example.com",
        "password": "securepassword123",
        "name": "E2E Voice Patient",
        "role": "Patient"
    }
    
    print("[*] Registering test patient...")
    reg_url = "http://localhost:8000/api/v1/public/auth/register"
    try:
        httpx.post(reg_url, json=login_payload, timeout=5.0)
    except Exception as e:
        print(f"[ERROR] API Gateway not reachable: {e}")
        sys.exit(1)
        
    print("[*] Logging in test patient...")
    login_url = "http://localhost:8000/api/v1/public/auth/login"
    login_resp = httpx.post(login_url, json={
        "email": login_payload["email"],
        "password": login_payload["password"]
    })
    
    if login_resp.status_code != 200:
        print(f"[FAIL] Login failed: {login_resp.text}")
        sys.exit(1)
        
    token = login_resp.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Check room voice token endpoint
    print("[*] Querying GET /api/v1/telehealth/rooms/voice-token...")
    token_url = "http://localhost:8000/api/v1/telehealth/rooms/voice-token"
    token_resp = httpx.get(token_url, headers=headers)
    assert token_resp.status_code == 200, f"Token request failed: {token_resp.text}"
    token_data = token_resp.json()
    assert "token" in token_data, "No signed JWT token returned"
    assert token_data["room_name"] == "voice_session_" + token_data["identity"], "Invalid room name mapping"
    print(f"[PASS] Voice Token successfully retrieved: {token_data['room_name']}")
    
    # 3. Check Chat dialogue endpoint
    chat_url = "http://localhost:8000/api/v1/agent/chat"
    
    # Check 3a: Welcome Greeting
    print("[*] Querying chatbot welcome input...")
    chat_resp = httpx.post(chat_url, headers=headers, json={"message": "Hello there!"})
    assert chat_resp.status_code == 200, f"Chat failed: {chat_resp.text}"
    welcome_text = chat_resp.json()["response"]
    print(f"    Bot response: '{welcome_text}'")
    assert "booking assistant" in welcome_text.lower(), "Welcome response did not mention booking assistant"
    print("[PASS] Welcome dialogue flow correct.")

    # Check 3b: Search Doctors list downstream
    print("[*] Querying doctor catalog search...")
    chat_resp = httpx.post(chat_url, headers=headers, json={"message": "search doctors"})
    assert chat_resp.status_code == 200, f"Chat failed: {chat_resp.text}"
    search_text = chat_resp.json()["response"]
    print(f"    Bot response: '{search_text}'")
    assert "alice heart" in search_text.lower() or "cardiologist" in search_text.lower(), "Search response did not return cardiology catalog"
    print("[PASS] Doctors search capability verified.")
    
    # Check 3c: Out-of-Scope rejection
    print("[*] Querying out of scope trivia question...")
    chat_resp = httpx.post(chat_url, headers=headers, json={"message": "How do I make chocolate cake?"})
    assert chat_resp.status_code == 200, f"Chat failed: {chat_resp.text}"
    rejection_text = chat_resp.json()["response"]
    print(f"    Bot response: '{rejection_text}'")
    assert "out of scope" in rejection_text.lower() or "configured" in rejection_text.lower(), "Bot did not decline off-topic question"
    print("[PASS] Out-of-scope guardrail verified.")
    
    # Check 3d: Emergency Triage Check & Hanging up session
    print("[*] Querying emergency triage triggers...")
    chat_resp = httpx.post(chat_url, headers=headers, json={"message": "I have chest pain"})
    assert chat_resp.status_code == 200, f"Chat failed: {chat_resp.text}"
    emergency_resp = chat_resp.json()
    print(f"    Bot response: '{emergency_resp['response']}'")
    assert emergency_resp["is_emergency"] == True, "Emergency flag not raised"
    assert "call 9 1 1" in emergency_resp["response"] or "call 911" in emergency_resp["response"], "No emergency warn dispatched"
    print("[PASS] Triage safety checks verified.")
    
    # Check 3e: Past Consultation History Summary
    print("[*] Querying past consultation history summary...")
    chat_resp = httpx.post(chat_url, headers=headers, json={"message": "summarize my medical history"})
    assert chat_resp.status_code == 200, f"Chat failed: {chat_resp.text}"
    history_text = chat_resp.json()["response"]
    print(f"    Bot response: '{history_text}'")
    assert "appointment" in history_text.lower() or "consultation" in history_text.lower(), "History response incorrect"
    print("[PASS] History timeline summary verified.")
    
    # 4. Clean up test user
    print("[*] Cleaning up test patient credentials...")
    del_url = "http://localhost:8000/api/v1/users/me"
    del_resp = httpx.delete(del_url, headers=headers)
    assert del_resp.status_code == 204
    print("[PASS] User cleanup completed.")
    
    print("\n============================================================\n[ALL PHASE 9.3 E2E VERIFICATION CHECKS PASSED SUCCESSFULLY]\n============================================================\n")

if __name__ == "__main__":
    run_e2e_checks()
