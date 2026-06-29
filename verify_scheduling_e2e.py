import sys
import httpx
import time

GATEWAY_URL = "http://localhost:8000"

def run_scheduling_e2e_tests():
    print("============================================================")
    print("[SCHEDULING FEATURE E2E TEST SUITE START]")
    
    # 1. Register & Login Test Patient
    timestamp = int(time.time())
    payload_patient = {
        "email": f"sched_test_patient_{timestamp}@example.com",
        "password": "securepassword123",
        "name": "Scheduling Test Patient",
        "role": "Patient"
    }
    
    print("[*] Registering test patient...")
    reg_url = f"{GATEWAY_URL}/api/v1/public/auth/register"
    try:
        reg_resp = httpx.post(reg_url, json=payload_patient, timeout=5.0)
    except Exception as e:
        print(f"[FAIL] API Gateway not reachable at {GATEWAY_URL}: {e}")
        sys.exit(1)
        
    assert reg_resp.status_code in (200, 201), f"Reg failed: {reg_resp.text}"
    token = reg_resp.json()["token"]
    patient_id = reg_resp.json()["user"]["id"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"[PASS] Registered test patient ID: {patient_id}")

    # 2. Search Doctor Directory via Gateway public endpoint
    print("[*] Scenario 1: Searching provider directory (Specialty: Cardiologist)...")
    search_url = f"{GATEWAY_URL}/api/v1/public/doctors"
    search_resp = httpx.get(search_url, params={"specialty": "Cardiologist"})
    assert search_resp.status_code == 200, f"Search failed: {search_resp.text}"
    doctors = search_resp.json()
    assert len(doctors) > 0, "No doctors returned for Cardiologist specialty"
    
    doctor = doctors[0]
    doctor_id = doctor["id"]
    print(f"[PASS] Found doctor: Dr. {doctor['user']['name']} ({doctor['specialty']}) | ID: {doctor_id}")

    # 3. Fetch Doctor Availability slots via Gateway public endpoint
    # target date: next week Monday
    target_date = "2026-07-06"
    print(f"[*] Scenario 2: Querying availability slots for Dr. {doctor['name']} on {target_date}...")
    avail_url = f"{GATEWAY_URL}/api/v1/public/doctors/{doctor_id}/availability"
    avail_resp = httpx.get(avail_url, params={"date": target_date})
    assert avail_resp.status_code == 250 or avail_resp.status_code == 200, f"Avail failed: {avail_resp.text}"
    slots = avail_resp.json()
    assert len(slots) > 0, "No available slots returned for target date"
    
    selected_slot = slots[0]
    print(f"[PASS] Retrieved {len(slots)} open slots. Selected slot: {selected_slot}")

    # 4. Book Appointment Slot (Db commit check)
    print(f"[*] Scenario 3: Committing appointment reservation for slot {selected_slot}...")
    book_url = f"{GATEWAY_URL}/api/v1/appointments"
    booking_payload = {
        "doctor_id": doctor_id,
        "patient_id": patient_id,
        "appointment_time": selected_slot,
        "consult_type": "telehealth",
        "reason_for_visit": "E2E Scheduling validation checks"
    }
    
    book_resp = httpx.post(book_url, headers=headers, json=booking_payload)
    assert book_resp.status_code in (200, 201), f"Booking failed: {book_resp.text}"
    booking_id = book_resp.json()["id"]
    print(f"[PASS] Appointment successfully booked! Booking ID: {booking_id}")

    # 5. Concurrency & Conflict Protection Check (Double-booking slot block)
    print("[*] Scenario 4: Attempting duplicate reservation on the same slot (expected conflict reject)...")
    conflict_resp = httpx.post(book_url, headers=headers, json=booking_payload)
    print(f"    Duplicate booking response status code: {conflict_resp.status_code}")
    assert conflict_resp.status_code in (400, 409), f"Security check failed: slot double-booking was NOT blocked! Status: {conflict_resp.status_code}"
    print("[PASS] Double-booking conflict handler successfully blocked duplicate reservation.")

    # 6. Clean up: Delete Test Patient
    print("[*] Cleaning up test user assets...")
    del_url = f"{GATEWAY_URL}/api/v1/users/me"
    del_resp = httpx.delete(del_url, headers=headers)
    assert del_resp.status_code == 204
    print("[PASS] Test cleanup complete.")
    
    print("\n============================================================")
    print("[ALL DIRECTORY SEARCH & SCHEDULING INTEGRATION CHECKS PASSED]")
    print("============================================================\n")

if __name__ == "__main__":
    run_scheduling_e2e_tests()
