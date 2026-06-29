import sys
import httpx

GATEWAY_URL = "http://localhost:8000"

def run_voice_agent_e2e_tests():
    print("============================================================")
    print("[CONVERSATIONAL VOICE AGENT E2E TEST SUITE START]")
    
    headers = {}
    chat_url = f"{GATEWAY_URL}/api/v1/agent/chat"
    
    # 1. Scenario 1: General Greeting check
    print("[*] Scenario 1: Sending general greeting conversation...")
    try:
        resp = httpx.post(chat_url, headers=headers, json={"message": "Hi, who are you?"})
    except Exception as e:
        print(f"[FAIL] Gateway not reachable: {e}")
        sys.exit(1)
        
    assert resp.status_code == 200, f"Greeting failed: {resp.text}"
    welcome_text = resp.json()["response"]
    print(f"    Agent Response: '{welcome_text}'")
    assert "assistant" in welcome_text.lower() or "physical" in welcome_text.lower() or "book" in welcome_text.lower(), "Unexpected greeting response"
    print("[PASS] Greeting intro validated.")

    # 2. Scenario 2: Out-of-Scope Blocker check
    print("[*] Scenario 2: Sending out-of-scope query (how to build python code/cake recipe)...")
    out_of_scope_resp = httpx.post(chat_url, headers=headers, json={"message": "how do I make chocolate cake?"})
    assert out_of_scope_resp.status_code == 200
    block_text = out_of_scope_resp.json()["response"]
    print(f"    Agent Response: '{block_text}'")
    assert "out-of-scope" in block_text.lower() or "assist only" in block_text.lower() or "cannot answer" in block_text.lower(), "Off-topic query was not blocked!"
    print("[PASS] Out-of-scope blocker successfully blocked off-topic question.")

    # 3. Scenario 3: Emergency Triage blocks
    print("[*] Scenario 3: Sending emergency warning trigger (chest pain)...")
    emergency_resp = httpx.post(chat_url, headers=headers, json={"message": "I have severe chest pain and shortness of breath."})
    assert emergency_resp.status_code == 200
    emergency_data = emergency_resp.json()
    print(f"    Agent Response: '{emergency_data['response']}'")
    print(f"    is_emergency: {emergency_data['is_emergency']}")
    assert emergency_data["is_emergency"] == True, "Emergency flag not set!"
    assert "9 1 1" in emergency_data["response"] or "911" in emergency_data["response"], "ER call warning text missing"
    print("[PASS] Safety triage checker successfully flagged emergency and recommended emergency care.")

    # 4. Scenario 4: Consultation History summary
    print("[*] Scenario 4: Querying clinical history timeline summary...")
    history_resp = httpx.post(chat_url, headers=headers, json={"message": "summarize my medical history"})
    assert history_resp.status_code == 200
    history_text = history_resp.json()["response"]
    print(f"    Agent Response: '{history_text}'")
    assert len(history_text) > 0, "Empty history summary response"
    print("[PASS] Consult history summary flow verified.")

    print("\n============================================================")
    print("[ALL CONVERSATIONAL VOICE AGENT E2E CHECKS PASSED]")
    print("============================================================\n")

if __name__ == "__main__":
    run_voice_agent_e2e_tests()
