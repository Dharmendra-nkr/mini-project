"""Test booking with different dates."""
import requests
import json

BASE_URL = "http://localhost:8000/api/chat"

# Step 1: Search for rooms with different dates
print("=== STEP 1: Search for rooms (March 20-23) ===")
payload = {
    "message": "I want to book a room for 2 people from March 20 to March 23 with an ocean view around $500 per night"
}
r1 = requests.post(BASE_URL + "/", json=payload, timeout=30)
d1 = r1.json()
session_id = d1["session_id"]
print(f"Quick Replies: {d1.get('quick_replies', [])}")
print()

# Step 2: Book specific room with extended timeout
print("=== STEP 2: Book Reef Deluxe (R302) ===")
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
        print(f"\nAgent response:\n{msg}\n")
        if "booking" in msg.lower() and "confirmed" in msg.lower():
            print("✅ Booking confirmed!")
            import re
            match = re.search(r'(GM\d{8})', msg)
            if match:
                print(f"Booking Reference: {match.group(1)}")
        elif "gm" in msg.lower():
            print("✅ Booking created!")
            import re
            match = re.search(r'(GM\d{8})', msg, re.IGNORECASE)
            if match:
                print(f"Booking Reference: {match.group(1)}")
    else:
        print(f"Error: {r2.text[:500]}")
except requests.exceptions.Timeout:
    print("❌ Request timed out after 120 seconds")
except Exception as e:
    print(f"❌ Error: {e}")
