import os
import sys
import time
import subprocess
import json
import httpx
from datetime import datetime, timedelta

print("=" * 60)
print("Scheduling Microservice Integration & Concurrency Test")
print("=" * 60)

# Mocks and details mapped from seed outputs
PATIENT_1_ID = "de4ee42a-fb20-4fd5-a988-2e3b9bc823f6"  # John Doe
PATIENT_2_ID = "e16fd83b-6d82-4392-aecc-258b40304736"  # Jane Smith
DR_HEART_ID = "a514729d-bb6b-4895-adea-ded6c2e5d35b"   # Cardiologist
DR_TOOTH_ID = "6adaf1cf-0112-4735-8741-28b3c638b044"   # Dentist

SERVER_URL = "http://127.0.0.1:8001"

print("Step 1: Spawning uvicorn scheduling microservice subprocess on port 8001...")
env = os.environ.copy()
env["PYTHONPATH"] = "."  # Ensure app module resolves locally

process = subprocess.Popen(
    ["../../venv/bin/python3", "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8001"],
    cwd=".",
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True,
    env=env
)

# Wait for uvicorn to bind
time.sleep(2.0)

# Check if process crashed
if process.poll() is not None:
    print("Error: Scheduling server failed to start. Logs:")
    print(process.stdout.read())
    sys.exit(1)

print("Scheduling server successfully started.")
print("-" * 60)

success = True

try:
    with httpx.Client(timeout=5.0) as client:
        # Test 1: Fetch list of doctors (filter: Dentist)
        print("Test 1: GET /doctors?specialty=Dentist (Search Doctor)")
        res1 = client.get(f"{SERVER_URL}/doctors?specialty=Dentist")
        print(f"  Status: {res1.status_code}")
        print(f"  Body: {res1.text}")
        doctors = res1.json()
        if res1.status_code != 200 or len(doctors) != 1 or doctors[0]["id"] != DR_TOOTH_ID:
            print("  FAIL: Expected 1 Dentist (Dr. Tooth).")
            success = False
        else:
            print("  PASS")
        print("-" * 40)

        # Test 2: Fetch Doctor Availability (target date: tomorrow)
        # Dr. Heart is out from 11:00 to 13:00 tomorrow (exception block).
        # We verify that slots 11:00 AM, 11:30 AM, 12:00 PM, and 12:30 PM are missing from the availability list.
        tomorrow = datetime.now().date() + timedelta(days=1)
        tomorrow_str = tomorrow.isoformat()
        
        print(f"Test 2: GET /doctors/{DR_HEART_ID}/availability?date={tomorrow_str}")
        res2 = client.get(f"{SERVER_URL}/doctors/{DR_HEART_ID}/availability?date={tomorrow_str}")
        print(f"  Status: {res2.status_code}")
        slots = res2.json()
        
        # Parse slot datetimes to check hours
        slot_hours = [datetime.fromisoformat(s).hour for s in slots]
        slot_minutes = [datetime.fromisoformat(s).minute for s in slots]
        
        # Verify 11:00, 11:30, 12:00, 12:30 are missing
        blocked_slots_passed = True
        for h, m in [(11, 0), (11, 30), (12, 0), (12, 30)]:
            for sh, sm in zip(slot_hours, slot_minutes):
                if sh == h and sm == m:
                    blocked_slots_passed = False
                    print(f"  FAIL: Found blocked slot {h}:{m} in availability list!")
                    break
        
        if res2.status_code != 200 or not blocked_slots_passed:
            print("  FAIL: Doctor availability check failed.")
            success = False
        else:
            print("  PASS: Calendar exceptions correctly excluded.")
        print("-" * 40)

        # Find a valid open slot for testing booking (e.g., 9:00 AM tomorrow)
        booking_time = datetime.combine(tomorrow, time(9, 0))
        booking_time_str = booking_time.isoformat()

        # Test 3: Create Appointment
        print(f"Test 3: POST /appointments (Reserve slot for Patient 1 at {booking_time_str})")
        booking_payload = {
            "doctor_id": DR_HEART_ID,
            "appointment_time": booking_time_str,
            "consult_type": "telehealth",
            "reason_for_visit": "Experiencing palpitations and chest pressure.",
            "insurance_carrier": "Blue Cross",
            "insurance_plan": "Silver PPO"
        }
        res3 = client.post(
            f"{SERVER_URL}/appointments",
            json=booking_payload,
            headers={"X-User-Id": PATIENT_1_ID}
        )
        print(f"  Status: {res3.status_code}")
        print(f"  Body: {res3.text}")
        if res3.status_code != 201 or res3.json().get("status") != "confirmed":
            print("  FAIL: Failed to book available slot.")
            success = False
        else:
            print("  PASS")
        print("-" * 40)

        # Test 4: Concurrency Block (Verify double-booking is rejected)
        print(f"Test 4: POST /appointments (Attempt duplicate booking for Patient 2 at same slot)")
        res4 = client.post(
            f"{SERVER_URL}/appointments",
            json=booking_payload,
            headers={"X-User-Id": PATIENT_2_ID}
        )
        print(f"  Status: {res4.status_code}")
        print(f"  Body: {res4.text}")
        if res4.status_code != 409:
            print("  FAIL: Double booking was not blocked! Expected status 409 Conflict.")
            success = False
        else:
            print("  PASS: Double booking rejected successfully.")
        print("-" * 40)

except Exception as e:
    print(f"Exception during test runs: {str(e)}")
    success = False

print("Step 3: Terminating microservice uvicorn process...")
process.terminate()
process.wait()

print("=" * 60)
if success:
    print("VERIFICATION COMPLETED SUCCESSFULLY - ALL PASSED")
    sys.exit(0)
else:
    print("VERIFICATION FAILED")
    sys.exit(1)
print("=" * 60)
