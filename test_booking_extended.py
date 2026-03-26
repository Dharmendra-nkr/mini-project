"""Test booking with extended timeout."""
import requests
import json

BASE_URL = "http://localhost:8000/api/chat"

# Step 1: Search for rooms
print("=== STEP 1: Search for rooms ===")
payload = {
    "message": "I want to book a room for 2 people from March 28 to March 31 with an ocean view around $500 per night"
}
r1 = requests.post(BASE_URL + "/", json=payload, timeout=30)
d1 = r1.json()
session_id = d1["session_id"]
print(f"Quick Replies: {d1.get('quick_replies', [])}")
print()

# Step 2: Book specific room with extended timeout
print("=== STEP 2: Book specific room (120s timeout) ===")
payload = {
    "session_id": session_id,
    "message": "I will book the Reef Deluxe room R302. My name is John Smith, john.smith@example.com, phone +1-555-0123."
}
print("Sending request...")
try:
    r2 = requests.post(BASE_URL + "/", json=payload, timeout=120)
    print(f"Status: {r2.status_code}")
    if r2.status_code == 200:
        d2 = r2.json()
        msg = d2.get("message", "")
        print(f"Agent response (first 300 chars): {msg[:300]}")
        if "booking" in msg.lower() and "confirmed" in msg.lower():
            print("✅ Booking confirmed!")
            if "GM" in msg:
                import re
                match = re.search(r'(GM\d+)', msg)
                if match:
                    print(f"Booking ref: {match.group(1)}")
    else:
        print(f"Error: {r2.text}")
except requests.exceptions.Timeout:
    print("❌ Request timed out after 120 seconds")
except Exception as e:
    print(f"❌ Error: {e}")
