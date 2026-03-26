"""Simple test to check API connectivity."""
import requests
import json

BASE_URL = "http://localhost:8000"

try:
    # Test 1: Health check
    print("Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/health", timeout=10)
    print(f"Health Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Health Response: {response.json()}\n")
    
    # Test 2: Chat greeting
    print("Testing chat greeting...")
    response = requests.get(f"{BASE_URL}/api/chat/greeting", timeout=10)
    print(f"Greeting Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Greeting Message: {data.get('message', 'N/A')[:100]}...\n")
    
    # Test 3: Simple chat message
    print("Testing chat endpoint with simple message...")
    payload = {"message": "Hello"}
    response = requests.post(f"{BASE_URL}/api/chat/", json=payload, timeout=30)
    print(f"Chat Status: {response.status_code}")
    print(f"Chat Response Headers: {dict(response.headers)}")
    print(f"Chat Response Length: {len(response.content)} bytes")
    print(f"Chat Response (first 200 chars): {response.text[:200]}")
    
    if response.status_code == 200:
        try:
            data = response.json()
            print(f"\n✅ Chat API is working!")
            print(f"Message: {data.get('message', 'N/A')[:150]}...")
        except json.JSONDecodeError as e:
            print(f"\n❌ Response is not valid JSON: {e}")
    else:
        print(f"\n❌ Chat API returned status {response.status_code}")
        
except requests.exceptions.Timeout:
    print("❌ Request timeout - server may be hanging")
except requests.exceptions.ConnectionError:
    print("❌ Cannot connect to backend at http://localhost:8000")
except Exception as e:
    print(f"❌ Error: {e}")
