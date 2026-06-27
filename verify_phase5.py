import sys
import time
import json
import httpx
import asyncio
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue

# Constants
GATEWAY_URL = "http://127.0.0.1:8000"
GATEWAY_WS_URL = "ws://127.0.0.1:8000"
QDRANT_PATH = "/tmp/medical_ai_qdrant_local"

def print_step(num, desc):
    print(f"\n==================================================")
    print(f" STEP {num}: {desc}")
    print(f"==================================================")

async def test_integration():
    # ----------------------------------------------------
    # STEP 1: Authenticate Patient and Doctor Users
    # ----------------------------------------------------
    print_step(1, "Authenticating test users (Patient & Doctor)")
    
    # Sign in as Doctor (Alice Heart)
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{GATEWAY_URL}/api/v1/public/auth/login", json={
            "email": "alice.heart@medical.com",
            "password": "dev_password_alice"
        })
        if resp.status_code != 200:
            print(f"[-] Doctor login failed: {resp.text}")
            sys.exit(1)
        doc_token = resp.json()["access_token"]
        print(f"[+] Doctor logged in. Token length: {len(doc_token)}")

        # Sign in as Patient (Bob Customer)
        resp = await client.post(f"{GATEWAY_URL}/api/v1/public/auth/login", json={
            "email": "bob.customer@gmail.com",
            "password": "dev_password_bob"
        })
        if resp.status_code != 200:
            print(f"[-] Patient login failed: {resp.text}")
            sys.exit(1)
        pat_token = resp.json()["access_token"]
        print(f"[+] Patient logged in. Token length: {len(pat_token)}")

    # ----------------------------------------------------
    # STEP 2: Fetch Seeded Draft Appointment & Approve Note
    # ----------------------------------------------------
    print_step(2, "Fetching seeded appointment and approving clinical note")
    
    # We list appointments to grab an active one with a draft note
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {doc_token}"}
        resp = await client.get(f"{GATEWAY_URL}/api/v1/appointments", headers=headers)
        if resp.status_code != 200 or len(resp.json()) == 0:
            print(f"[-] Failed to retrieve appointments or none seeded: {resp.text}")
            sys.exit(1)
        
        appointments = resp.json()
        target_appt = appointments[0] # Grab the first seeded appointment
        appt_id = target_appt["id"]
        print(f"[+] Targeting Appointment: {appt_id}")
        
        # Approve the clinical note draft
        approve_url = f"{GATEWAY_URL}/api/v1/appointments/{appt_id}/clinical-note/approve"
        resp = await client.post(approve_url, headers=headers)
        if resp.status_code != 200:
            print(f"[-] Failed to approve clinical note draft: {resp.text}")
            sys.exit(1)
        
        note_data = resp.json()
        print(f"[+] Clinical note approved! Status set to: {note_data.get('status')}")
        print(f"[+] Waiting 4 seconds for event-driven RabbitMQ indexer to process care plan...")
        await asyncio.sleep(4)

    # ----------------------------------------------------
    # STEP 3: Verify Qdrant Vector DB Indexing
    # ----------------------------------------------------
    print_step(3, "Verifying local Qdrant collection point insertion")
    
    q_client = QdrantClient(path=QDRANT_PATH)
    scroll_res = q_client.scroll(
        collection_name="care_plans",
        scroll_filter=Filter(
            must=[
                FieldCondition(
                    key="appointment_id",
                    match=MatchValue(value=appt_id)
                )
            ]
        ),
        limit=100
    )
    points = scroll_res[0]
    print(f"[+] Found {len(points)} vectorized care plan lines in Qdrant for appointment {appt_id}")
    if len(points) == 0:
        print("[-] Verification failed: Qdrant was not populated on note approval.")
        sys.exit(1)
    
    for idx, p in enumerate(points[:3]):
        print(f"   [{idx}] Segment ({p.payload.get('section')}): '{p.payload.get('content')}'")

    # ----------------------------------------------------
    # STEP 4: Connect to WebSocket Companion & Query Care Plan
    # ----------------------------------------------------
    print_step(4, "Establishing WebSocket companion session & querying care plan")
    
    import websockets
    ws_uri = f"{GATEWAY_WS_URL}/api/v1/appointments/{appt_id}/companion/chat"
    print(f"Connecting to: {ws_uri}")
    
    async with websockets.connect(ws_uri) as ws:
        # Initialize handshake
        init_payload = {"appointment_id": appt_id, "token": pat_token}
        await ws.send(json.dumps(init_payload))
        
        init_resp = await ws.recv()
        print(f"[<-] Handshake Response: {init_resp}")
        assert "connected" in init_resp or "active" in init_resp
        
        # Ask question covered by the care plan (Lisinopril or hypertension)
        query = "How often should I take my Lisinopril medication?"
        print(f"[->] Sending Question: '{query}'")
        await ws.send(json.dumps({"message": query}))
        
        query_resp = await ws.recv()
        print(f"[<-] Companion Reply: {query_resp}")
        resp_data = json.loads(query_resp)
        assert "response" in resp_data
        assert "lisinopril" in resp_data["response"].lower() or "medication" in resp_data["response"].lower()
        print("[+] Valid care plan query returned data-anchored results successfully!")

    # ----------------------------------------------------
    # STEP 5: Trigger Safety Triage Escalation
    # ----------------------------------------------------
    print_step(5, "Verifying emergency safety triage check & escalation protocol")
    
    async with websockets.connect(ws_uri) as ws:
        await ws.send(json.dumps({"appointment_id": appt_id, "token": pat_token}))
        await ws.recv() # clear handshake
        
        # Send emergency indicator
        emergency_msg = "I am having severe chest pain and shortness of breath."
        print(f"[->] Sending Emergency Query: '{emergency_msg}'")
        await ws.send(json.dumps({"message": emergency_msg}))
        
        emergency_resp = await ws.recv()
        print(f"[<-] Companion Reply: {emergency_resp}")
        resp_data = json.loads(emergency_resp)
        
        assert resp_data["escalation_triggered"] is True
        assert "911" in resp_data["response"]
        print("[+] Triage emergency message bypass succeeded and returned safety escalation statement.")

        # Check database is flagged for requires_escalation
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {pat_token}"}
            note_resp = await client.get(f"{GATEWAY_URL}/api/v1/appointments/{appt_id}/clinical-note", headers=headers)
            note_db = note_resp.json()
            print(f"[+] ClinicalNote requires_escalation database value: {note_db.get('requires_escalation')}")
            assert note_db.get("requires_escalation") is True
            print("[+] Database escalation flag verified successfully!")

    # ----------------------------------------------------
    # STEP 6: Verify Twilio Webhook Booking Triage & Booking Tools
    # ----------------------------------------------------
    print_step(6, "Verifying Twilio booking agent webhook triage and slot reservation")
    
    async with httpx.AsyncClient() as client:
        # Check emergency triage on SMS/Voice booking
        resp = await client.post(
            f"{GATEWAY_URL}/api/v1/public/booking/twilio",
            data={"Body": "I have severe chest pain and can't breathe"},
            params={"is_voice": "false"}
        )
        print(f"[+] Twilio Emergency Triage Response Status: {resp.status_code}")
        print(f"[+] Twilio Emergency Triage TwiML:\n{resp.text}")
        assert resp.status_code == 200
        assert "911" in resp.text
        assert "<Response>" in resp.text
        print("[+] SMS emergency triage booking lockout succeeded!")
        
        # Check booking availability lookup
        resp = await client.post(
            f"{GATEWAY_URL}/api/v1/public/booking/twilio",
            data={"Body": "I want to book an annual physical"},
            params={"is_voice": "false"}
        )
        print(f"[+] Twilio Search Response TwiML:\n{resp.text}")
        assert resp.status_code == 200
        assert "physical" in resp.text.lower() or "slot" in resp.text.lower()
        print("[+] Search tool availability check succeeded!")

        # Confirm booking slot
        resp = await client.post(
            f"{GATEWAY_URL}/api/v1/public/booking/twilio",
            data={"Body": "confirm"},
            params={"is_voice": "false"}
        )
        print(f"[+] Twilio Confirmation Response TwiML:\n{resp.text}")
        assert resp.status_code == 200
        assert "confirmed" in resp.text.lower()
        print("[+] Confirmed booking reservation succeeded!")

    print("\n==================================================")
    print(" ALL INTEGRATION TESTS PASSED 100% SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(test_integration())
