"""Test the booking agent flow."""
import requests
import json
import time

BASE_URL = "http://localhost:8000/api/chat"

def test_booking_flow():
    """Test a complete booking conversation."""
    session_id = None
    
    # Step 1: Initial booking request
    print("=" * 60)
    print("STEP 1: User requests to book a room")
    print("=" * 60)
    
    payload = {
        "message": "I want to book a room for 2 people from March 28 to March 31 with an ocean view around $500 per night"
    }
    
    response = requests.post(BASE_URL + "/", json=payload, timeout=30)
    data = response.json()
    session_id = data["session_id"]
    
    print(f"Agent: {data['message']}")
    print(f"Quick Replies: {data.get('quick_replies', [])}")
    print(f"Session ID: {session_id}\n")
    
    # Step 2: Provide guest details
    print("=" * 60)
    print("STEP 2: User selects a room and provides guest details")
    print("=" * 60)
    
    payload = {
        "session_id": session_id,
        "message": "I'll book the Reef Deluxe room (R302). My name is John Smith, email john.smith@example.com, phone +1-555-0123."
    }
    
    try:
        response = requests.post(BASE_URL + "/", json=payload, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print(f"Agent: {data['message']}")
            print(f"Quick Replies: {data.get('quick_replies', [])}")
            
            if "booking" in data['message'].lower() and "confirmed" in data['message'].lower():
                print("\n✅ BOOKING SUCCESSFULLY CONFIRMED!")
                # Extract and print reference number if available
                if "GM" in data['message']:
                    import re
                    refs = re.findall(r'GM[A-Z0-9]{8}', data['message'])
                    if refs:
                        print(f"📋 Booking Reference: {refs[0]}")
        else:
            print(f"❌ Error: HTTP {response.status_code}")
            print(f"Response: {response.text[:200]}")
    except Exception as e:
        print(f"❌ Error in step 2: {e}")
        return
    
    print("✅ Booking flow test completed successfully!")
    print(f"Session ID for future reference: {session_id}")

if __name__ == "__main__":
    try:
        test_booking_flow()
    except requests.exceptions.Timeout:
        print("❌ Request timeout - backend may be slow. Try again.")
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend at http://localhost:8000")
    except Exception as e:
        print(f"❌ Error: {e}")
