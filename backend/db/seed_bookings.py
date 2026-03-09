"""Generate ~2000 realistic bookings with no double-bookings, seasonal patterns."""
import random
import json
import string
import psycopg2
from datetime import date, timedelta

conn = psycopg2.connect(host="localhost", port=5432, dbname="mini", user="postgres", password="12345")
cur = conn.cursor()

# Fetch room data
cur.execute("SELECT id, base_price, capacity FROM rooms ORDER BY id;")
rooms = cur.fetchall()  # [(id, base_price, capacity), ...]
room_ids = [r[0] for r in rooms]
room_prices = {r[0]: float(r[1]) for r in rooms}
room_caps = {r[0]: r[2] for r in rooms}

# Fetch guest IDs
cur.execute("SELECT id FROM guests ORDER BY id;")
guest_ids = [r[0] for r in cur.fetchall()]

# Booking date range: Dec 2025 to May 2026 (6 months)
START_DATE = date(2025, 12, 1)
END_DATE = date(2026, 5, 31)

# Seasonal price multipliers (month -> multiplier)
SEASON = {
    12: 1.5,  # Peak holiday season
    1: 1.3,   # New Year
    2: 1.1,   # Valentine's
    3: 1.2,   # Spring break
    4: 0.9,   # Shoulder
    5: 0.85,  # Low season
}

STATUSES_PAST = ["checked_out"] * 70 + ["cancelled"] * 10 + ["no_show"] * 5
STATUSES_CURRENT = ["confirmed"] * 40 + ["checked_in"] * 50 + ["cancelled"] * 10
STATUSES_FUTURE = ["confirmed"] * 80 + ["pending"] * 15 + ["cancelled"] * 5

BOOKING_VIA = ["website"] * 50 + ["phone"] * 20 + ["agent"] * 15 + ["walk_in"] * 10 + ["partner"] * 5

SPECIAL_REQUESTS = [
    None, None, None, None, None,  # Most have none
    "Late check-in after 10 PM",
    "Extra pillows please",
    "Celebrating anniversary - any special arrangements would be lovely",
    "Allergic to feathers - need synthetic pillows",
    "Early check-in if possible",
    "Need a baby crib in the room",
    "Honeymoon couple - rose petals and champagne please",
    "Wheelchair accessible room preferred",
    "Birthday celebration - cake arrangement",
    "Connecting rooms if available",
    "Ground floor preferred for elderly parents",
    "Airport pickup needed",
    "Vegetarian meal plan",
    "Quiet room away from elevator",
    "Ocean-facing room strongly preferred",
    "Need extra towels for kids",
    "Celebrating 25th wedding anniversary",
    "First time at resort - any welcome package?",
    "Corporate stay - need good wifi and desk setup",
    "Yoga mat in room please",
]

# Track room bookings to prevent overlaps: room_id -> list of (check_in, check_out)
room_calendar = {rid: [] for rid in room_ids}

def has_overlap(room_id, check_in, check_out):
    for (ci, co) in room_calendar[room_id]:
        if check_in < co and check_out > ci:
            return True
    return False

def gen_booking_ref():
    return "GM" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

used_refs = set()
TODAY = date(2026, 3, 9)

bookings = []
attempts = 0
target = 2000

print(f"Generating {target} bookings...")

while len(bookings) < target and attempts < 50000:
    attempts += 1

    # Random check-in date within range
    days_offset = random.randint(0, (END_DATE - START_DATE).days - 1)
    check_in = START_DATE + timedelta(days=days_offset)

    # Stay duration: weighted towards 2-5 nights
    stay_weights = [1, 5, 15, 25, 25, 15, 8, 4, 2, 1]  # 1-10 nights
    stay_duration = random.choices(range(1, 11), weights=stay_weights, k=1)[0]
    check_out = check_in + timedelta(days=stay_duration)

    if check_out > END_DATE + timedelta(days=10):
        continue

    # Pick a room (weighted: cheaper rooms more popular)
    room_id = random.choice(room_ids)

    # Check for overlap
    if has_overlap(room_id, check_in, check_out):
        continue

    # Pick a guest
    guest_id = random.choice(guest_ids)

    # Calculate price with seasonal multiplier
    month = check_in.month
    multiplier = SEASON.get(month, 1.0)
    # Weekend surcharge
    if check_in.weekday() >= 4:  # Fri/Sat
        multiplier *= 1.15
    base = room_prices[room_id]
    total_price = round(base * stay_duration * multiplier + random.uniform(-20, 50), 2)
    total_price = max(total_price, base * stay_duration * 0.8)  # floor

    # Status based on dates
    if check_out < TODAY:
        status = random.choice(STATUSES_PAST)
    elif check_in <= TODAY <= check_out:
        status = random.choice(STATUSES_CURRENT)
    else:
        status = random.choice(STATUSES_FUTURE)

    # Number of guests
    cap = room_caps[room_id]
    num_guests = random.randint(1, cap)

    # Booking ref
    ref = gen_booking_ref()
    while ref in used_refs:
        ref = gen_booking_ref()
    used_refs.add(ref)

    # Payment
    if status == "cancelled":
        payment = random.choice(["refunded", "pending"])
    elif status in ("confirmed", "pending"):
        payment = random.choice(["paid"] * 8 + ["pending"] * 2)
    else:
        payment = "paid"

    via = random.choice(BOOKING_VIA)
    special = random.choice(SPECIAL_REQUESTS)

    # Booked at: 1-60 days before check-in
    days_before = random.randint(1, 60)
    booked_at = check_in - timedelta(days=days_before)
    if booked_at < date(2025, 10, 1):
        booked_at = date(2025, 10, random.randint(1, 31))

    cancelled_at = None
    if status == "cancelled":
        cancel_offset = random.randint(1, max(1, (check_in - booked_at).days))
        cancelled_at = booked_at + timedelta(days=cancel_offset)

    bookings.append((
        ref, guest_id, room_id, check_in, check_out, num_guests,
        status, total_price, special, payment, via,
        booked_at, cancelled_at
    ))

    # Record in calendar (even cancelled ones occupy the slot in generation to be realistic)
    if status != "cancelled":
        room_calendar[room_id].append((check_in, check_out))

print(f"Generated {len(bookings)} bookings in {attempts} attempts.")

# Batch insert
cur.executemany("""
    INSERT INTO bookings (booking_ref, guest_id, room_id, check_in, check_out, num_guests,
                          status, total_price, special_requests, payment_status, booked_via,
                          booked_at, cancelled_at)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
""", bookings)

conn.commit()

cur.execute("SELECT COUNT(*) FROM bookings;")
print(f"Total bookings in DB: {cur.fetchone()[0]}")

cur.execute("SELECT status, COUNT(*) FROM bookings GROUP BY status ORDER BY COUNT(*) DESC;")
for row in cur.fetchall():
    print(f"  {row[0]}: {row[1]}")

cur.close()
conn.close()
