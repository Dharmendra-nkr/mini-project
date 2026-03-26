import requests
import json
import time

time.sleep(2)

try:
    r = requests.get('http://localhost:8000/api/rooms/', timeout=10)
    print(f'Status: {r.status_code}')
    if r.status_code == 200:
        data = r.json()
        rooms = data.get('rooms', [])
        print(f'Rooms found: {len(rooms)}')
        if rooms:
            print(f'First room: {rooms[0]["room_name"]} (ID: {rooms[0]["id"]})')
    else:
        print(f'Error: {r.text[:300]}')
except Exception as e:
    print(f'Exception: {e}')
