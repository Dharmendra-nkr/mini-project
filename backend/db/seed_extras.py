"""Generate booking add-ons, reviews, manager accounts, and analytics events."""
import random
import json
import psycopg2
from datetime import date, timedelta, datetime

conn = psycopg2.connect(host="localhost", port=5432, dbname="mini", user="postgres", password="12345")
cur = conn.cursor()

# ========== BOOKING ADD-ONS ==========
print("Generating booking add-ons...")

cur.execute("SELECT id, check_in, check_out, status FROM bookings WHERE status NOT IN ('cancelled', 'no_show');")
active_bookings = cur.fetchall()

ADDON_CATALOG = {
    "spa": [
        ("Deep Ocean Massage", 120, 180),
        ("Coral Reef Couples Spa", 250, 350),
        ("Aromatherapy Session", 80, 120),
        ("Hot Stone Therapy", 100, 150),
        ("Ayurvedic Rejuvenation", 150, 250),
        ("Sunset Yoga + Spa Combo", 90, 140),
    ],
    "dining": [
        ("Beachside Candlelight Dinner", 150, 300),
        ("Seafood Platter for Two", 80, 150),
        ("Chef's Table Experience", 200, 400),
        ("Tropical Breakfast Basket", 40, 60),
        ("Sunset Cocktail Package", 50, 90),
        ("Full Board Meal Plan (per day)", 60, 100),
    ],
    "tour": [
        ("Island Hopping Adventure", 100, 200),
        ("Mangrove River Safari", 70, 120),
        ("Historical Lighthouse Tour", 40, 70),
        ("Scenic Helicopter Ride", 300, 600),
        ("Guided Reef Snorkeling", 60, 100),
        ("Village Cultural Walk", 30, 50),
    ],
    "transport": [
        ("Airport Pickup (Sedan)", 50, 80),
        ("Airport Pickup (SUV)", 70, 110),
        ("Private Yacht Half Day", 500, 900),
        ("Car Rental (per day)", 60, 100),
        ("Bicycle Rental (per day)", 15, 25),
        ("E-Scooter Rental (per day)", 20, 35),
    ],
    "activity": [
        ("Scuba Diving Intro Course", 120, 200),
        ("Surfing Lesson", 60, 100),
        ("Jet Ski (1 hour)", 80, 140),
        ("Parasailing Experience", 90, 150),
        ("Deep Sea Fishing Trip", 150, 280),
        ("Kayak Mangrove Tour", 50, 80),
        ("Stand-Up Paddleboard", 30, 50),
        ("Beach Volleyball Tournament", 0, 0),
        ("Kids Club (full day)", 40, 60),
    ],
    "package": [
        ("Romance Package", 200, 400),
        ("Adventure Seeker Bundle", 180, 350),
        ("Family Fun Pack", 150, 300),
        ("Wellness Retreat Package", 250, 450),
        ("Honeymoon Special", 300, 500),
    ],
}

addons = []
for booking_id, check_in, check_out, status in active_bookings:
    # ~40% of bookings have add-ons
    if random.random() > 0.4:
        continue

    num_addons = random.choices([1, 2, 3, 4], weights=[50, 30, 15, 5], k=1)[0]
    used_types = set()

    for _ in range(num_addons):
        addon_type = random.choice(list(ADDON_CATALOG.keys()))
        if addon_type in used_types and random.random() > 0.3:
            continue
        used_types.add(addon_type)

        addon_name, min_p, max_p = random.choice(ADDON_CATALOG[addon_type])
        price = round(random.uniform(min_p, max_p), 2) if max_p > 0 else 0
        qty = 1 if addon_type not in ("dining", "transport") else random.randint(1, 3)

        stay_len = (check_out - check_in).days
        sched_offset = random.randint(0, max(0, stay_len - 1))
        scheduled = check_in + timedelta(days=sched_offset)

        details = json.dumps({"notes": f"Booked for {scheduled}", "guests": random.randint(1, 4)})

        addons.append((booking_id, addon_type, addon_name, details, price, qty, scheduled, "confirmed"))

cur.executemany("""
    INSERT INTO booking_addons (booking_id, addon_type, addon_name, details, price, quantity, scheduled_date, status)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
""", addons)

conn.commit()
print(f"Inserted {len(addons)} booking add-ons.")

# ========== REVIEWS ==========
print("Generating reviews...")

cur.execute("SELECT b.id, b.guest_id, b.room_id FROM bookings b WHERE b.status = 'checked_out';")
checkout_bookings = cur.fetchall()

REVIEW_TITLES = [
    "Amazing stay!", "Paradise found", "Will definitely return", "Exceeded expectations",
    "Beautiful resort", "Perfect getaway", "Loved every moment", "Incredible experience",
    "Best vacation ever", "Wonderful hospitality", "Stunning views", "A dream come true",
    "Good but could improve", "Decent stay", "Nice resort, some issues",
    "Below expectations", "Needs improvement", "Average experience",
    "Not worth the price", "Disappointing", "Room was okay, service lacked",
    "Great location, okay rooms", "Fantastic staff!", "Clean and comfortable",
    "Romantic setting", "Family-friendly paradise", "Quiet and relaxing",
    "Fun activities available", "Food was exceptional", "Spa was heavenly",
]

REVIEW_COMMENTS = [
    "The room was spotless and the ocean view was breathtaking. Staff went above and beyond!",
    "We had a wonderful time. The 3D room selection on the website really helped us pick the perfect room.",
    "The beach access from Coral Wing was incredible. Waking up to the sound of waves is priceless.",
    "Friendly staff, beautiful property, delicious food. Can't ask for more!",
    "The sunset from Reef Wing was the highlight of our trip. Absolutely magical.",
    "Great resort for families. Kids loved the pool and the kids club activities.",
    "The Presidential Suite was worth every penny. Butler service was impeccable.",
    "Spa treatments were world-class. I feel completely rejuvenated.",
    "Enjoyed the island hopping tour organized by the resort. Very professional.",
    "Room was a bit smaller than expected but the amenities made up for it.",
    "The restaurant options were diverse and all delicious. Loved the seafood.",
    "Perfect honeymoon destination. The romance package was a lovely touch.",
    "The garden views from Palm Wing were serene. Great for morning yoga.",
    "Wifi could be better but honestly, we didn't need it much with the beach!",
    "Check-in was smooth and the welcome drink set the perfect tone.",
    "The concierge was extremely helpful in planning our activities.",
    "We'll be back! Already planning our next stay in a penthouse suite.",
    "Room cleaning was immaculate. Loved the towel art!",
    "Good resort but the pool area gets crowded in the afternoon.",
    "The 3D map of the resort helped us choose the perfect floor and view. Genius!",
    "Marina view from our room was wonderful. Watched boats come and go all day.",
    "Sound insulation could be better between rooms. Heard neighbors a few times.",
    "Breakfast buffet had amazing variety. Something for everyone.",
    "The helicopter tour was an unforgettable experience. Highly recommend!",
    "Staff remembered our anniversary and surprised us with cake. So thoughtful!",
]

reviews = []
reviewed_bookings = set()

for booking_id, guest_id, room_id in checkout_bookings:
    # ~60% of checked-out guests leave a review
    if random.random() > 0.6:
        continue
    if booking_id in reviewed_bookings:
        continue
    reviewed_bookings.add(booking_id)

    # Rating distribution: skewed positive (resort is good!)
    overall = random.choices([1, 2, 3, 4, 5], weights=[2, 5, 15, 35, 43], k=1)[0]
    # Sub-ratings correlate with overall but with noise
    def sub_rating(base):
        r = base + random.choice([-1, 0, 0, 0, 1])
        return max(1, min(5, r))

    cleanliness = sub_rating(overall)
    service = sub_rating(overall)
    location = sub_rating(min(5, overall + 1))  # location is usually rated high
    value = sub_rating(overall)

    title = random.choice(REVIEW_TITLES)
    comment = random.choice(REVIEW_COMMENTS)

    # Review created 1-14 days after checkout
    created = date(2026, 3, 9)  # placeholder, will be overridden
    reviews.append((booking_id, guest_id, room_id, overall, cleanliness, service, location, value, title, comment))

cur.executemany("""
    INSERT INTO reviews (booking_id, guest_id, room_id, overall_rating, cleanliness_rating,
                        service_rating, location_rating, value_rating, title, comment)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
""", reviews)

conn.commit()
print(f"Inserted {len(reviews)} reviews.")

# ========== MANAGERS ==========
print("Creating manager accounts...")

managers = [
    ("Rajesh Kapoor", "rajesh.kapoor@grandmeridian.com", "admin", json.dumps({"all": True})),
    ("Priya Menon", "priya.menon@grandmeridian.com", "manager", json.dumps({"analytics": True, "bookings": True, "guests": True, "rooms": True})),
    ("David Chen", "david.chen@grandmeridian.com", "manager", json.dumps({"analytics": True, "bookings": True, "guests": True})),
    ("Sarah Williams", "sarah.williams@grandmeridian.com", "front_desk", json.dumps({"bookings": True, "guests": True, "check_in": True})),
    ("Arun Nair", "arun.nair@grandmeridian.com", "front_desk", json.dumps({"bookings": True, "guests": True, "check_in": True})),
    ("Maria Santos", "maria.santos@grandmeridian.com", "housekeeping", json.dumps({"rooms": True, "maintenance": True})),
]

for name, email, role, perms in managers:
    # Using pgcrypto for password hashing
    cur.execute("""
        INSERT INTO managers (name, email, password_hash, role, permissions)
        VALUES (%s, %s, crypt(%s, gen_salt('bf')), %s, %s)
    """, (name, email, "GrandMeridian2026!", role, perms))

conn.commit()
print(f"Inserted {len(managers)} manager accounts.")

# ========== ANALYTICS EVENTS ==========
print("Generating analytics events...")

EVENT_TYPES = [
    "page_view", "room_search", "room_view", "booking_started", "booking_completed",
    "booking_cancelled", "chat_started", "chat_completed", "voice_session",
    "3d_model_loaded", "3d_room_clicked", "3d_floor_filtered", "3d_date_changed",
    "review_submitted", "addon_purchased", "manager_login", "report_generated",
    "availability_checked", "room_photo_viewed", "price_comparison",
]

SOURCES = ["website", "mobile", "agent", "api", "manager_dashboard"]

events = []
for _ in range(3000):
    event_type = random.choice(EVENT_TYPES)
    source = random.choice(SOURCES)

    # Random timestamp over last 3 months
    days_ago = random.randint(0, 90)
    hours = random.randint(0, 23)
    minutes = random.randint(0, 59)
    ts = datetime(2026, 3, 9) - timedelta(days=days_ago, hours=hours, minutes=minutes)

    metadata = {}
    if event_type == "room_view":
        metadata = {"room_id": random.randint(1, 120), "duration_sec": random.randint(5, 120)}
    elif event_type == "room_search":
        metadata = {"filters": {"view": random.choice(["ocean", "garden", "pool", "any"]), "floor": random.randint(1, 5)}}
    elif event_type == "booking_completed":
        metadata = {"booking_id": random.randint(1, 2000), "total": round(random.uniform(200, 3000), 2)}
    elif event_type == "3d_room_clicked":
        metadata = {"room_id": random.randint(1, 120), "wing": random.choice(["Coral", "Horizon", "Palm", "Reef"])}
    elif event_type == "chat_started":
        metadata = {"intent": random.choice(["booking", "inquiry", "complaint", "recommendation"])}
    elif event_type == "voice_session":
        metadata = {"duration_sec": random.randint(10, 300), "language": random.choice(["en", "hi", "es", "fr", "de"])}
    else:
        metadata = {"detail": event_type}

    events.append((event_type, source, json.dumps(metadata), ts))

cur.executemany("""
    INSERT INTO analytics_events (event_type, source, metadata, created_at)
    VALUES (%s, %s, %s, %s)
""", events)

conn.commit()
print(f"Inserted {len(events)} analytics events.")

# ========== FINAL SUMMARY ==========
print("\n===== DATABASE SUMMARY =====")
tables = ["wings", "room_types", "rooms", "guests", "bookings", "booking_addons", "reviews", "managers", "analytics_events"]
for t in tables:
    cur.execute(f"SELECT COUNT(*) FROM {t};")
    print(f"  {t}: {cur.fetchone()[0]} rows")

cur.close()
conn.close()
print("\nPhase 1 complete! Database is fully seeded.")
