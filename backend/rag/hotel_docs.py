"""
Synthetic knowledge base for Grand Meridian Resort.
Each document is a chunk of text about a specific topic.
These are embedded into vectors for semantic retrieval.
"""

HOTEL_DOCUMENTS = [
    # ──────────────────────── OVERVIEW ────────────────────────
    {
        "id": "overview_01",
        "category": "overview",
        "title": "About Grand Meridian Resort",
        "text": (
            "Grand Meridian Resort is an award-winning luxury oceanfront property located on a pristine "
            "stretch of coastline. Established in 2008, the resort spans 18 acres of manicured tropical "
            "gardens, private beach, and crystal-clear lagoon. It has earned 5-star ratings from Forbes "
            "Travel Guide, Condé Nast Traveler, and Travel + Leisure for seven consecutive years. "
            "The resort accommodates up to 400 guests across its 120 rooms and suites in four distinctive "
            "wings: Coral, Horizon, Palm, and Reef. The property employs over 350 hospitality professionals "
            "dedicated to delivering exceptional, personalised service."
        ),
    },
    {
        "id": "overview_02",
        "category": "overview",
        "title": "Grand Meridian Resort Vision and Awards",
        "text": (
            "Grand Meridian Resort's philosophy is 'Every Stay, a Story'. The resort focuses on curating "
            "deeply personal experiences for every guest. It was voted #1 Luxury Beach Resort in Asia-Pacific "
            "by Condé Nast Traveler Readers' Choice Awards 2024. It received the Green Globe Certification "
            "for sustainability in 2023 and the PATA Gold Award for Responsible Tourism. The resort supports "
            "local coral reef conservation through the Meridian Marine Foundation and plants a tree for every "
            "booking made."
        ),
    },

    # ──────────────────────── WINGS ────────────────────────
    {
        "id": "wings_coral",
        "category": "wings",
        "title": "Coral Wing",
        "text": (
            "The Coral Wing is the resort's most sought-after accommodation block, built directly on the "
            "beachfront with rooms just 30 metres from the waterline. It features 30 rooms across 5 floors. "
            "Rooms in this wing offer unobstructed ocean views, and guests can hear the waves from their "
            "private balcony. The wing is ideal for ocean lovers, honeymooners, and guests seeking a classic "
            "beach resort experience. Direct beach access is available via a private staircase from the wing. "
            "Coral Wing rooms are priced from $250/night (floor 1 Superior) to $3000/night (Coral Penthouse "
            "on floor 5). Popular room types: Ocean Deluxe, Beach Villa, Coral Penthouse."
        ),
    },
    {
        "id": "wings_horizon",
        "category": "wings",
        "title": "Horizon Wing",
        "text": (
            "The Horizon Wing is the resort's premium tower, standing 5 floors tall with panoramic 270-degree "
            "views of the ocean, coastline, and distant islands. It houses the resort's most exclusive suites "
            "including the Presidential Suite and Reef Penthouse. The rooftop Horizon Sky Lounge is accessible "
            "to all Horizon guests. This wing is best for special occasions, business travellers requiring "
            "premium amenities, and guests who want the best views in the resort. Rooms start from $300/night "
            "for a Classic room and reach $2800/night for the Reef Penthouse. All Horizon rooms above floor 3 "
            "include butler service."
        ),
    },
    {
        "id": "wings_palm",
        "category": "wings",
        "title": "Palm Wing",
        "text": (
            "The Palm Wing is the resort's family-friendly accommodation block, nestled among towering coconut "
            "palms and tropical gardens. It offers the largest rooms in the resort, with many featuring "
            "interconnecting layouts ideal for families. The wing has direct access to the family pool, "
            "children's splash zone, and Kids Club. Garden-facing rooms provide a quiet, nature-immersed "
            "experience away from the ocean noise. Rooms include kids_corner amenities in family suites. "
            "Palm Wing rates start from $150/night (Classic) to $1800/night (Presidential Suite). "
            "Recommended for families with children, couples wanting garden tranquility, and long-stay guests."
        ),
    },
    {
        "id": "wings_reef",
        "category": "wings",
        "title": "Reef Wing",
        "text": (
            "The Reef Wing overlooks the resort's private marina and offers stunning sunset views every evening. "
            "It is the most intimate and exclusive wing with only 30 rooms, giving it a boutique feel. "
            "Guests can watch yachts and traditional fishing boats from their balconies. The wing has exclusive "
            "access to the marina bar, private pier, and sunset cruises. Rooms in the Reef Wing feature "
            "sunset_view and marina_view types. Rates range from $200/night to $2500/night for the top-floor "
            "Sunset Suite. Ideal for guests wanting a peaceful, exclusive atmosphere, sunset lovers, and "
            "boating enthusiasts."
        ),
    },

    # ──────────────────────── ROOMS ────────────────────────
    {
        "id": "rooms_types",
        "category": "rooms",
        "title": "Room Types and Pricing",
        "text": (
            "Grand Meridian Resort offers 10 distinct room types. Classic Rooms (floors 1-2, $150-200/night) "
            "feature standard amenities and courtyard or garden views. Superior Rooms ($200-270/night) offer "
            "larger spaces and better views. Deluxe Rooms ($280-350/night) come with premium furnishings and "
            "partial ocean views. Ocean Deluxe ($380-480/night) has full unobstructed ocean views and a large "
            "balcony. Garden Suite ($400-550/night) offers garden/pool views with a separate living area. "
            "Sunset Suite ($600-850/night) captures dramatic marina sunsets. Presidential Suite ($1200-1500/night) "
            "is a 2-bedroom suite with private terrace and plunge pool. Beach Villa ($1500-2000/night) is a "
            "standalone villa steps from the beach. Coral Penthouse ($2500-3000/night) is the ultimate ocean "
            "experience with 180-degree views. Reef Penthouse ($2500-2800/night) features panoramic sunset vistas."
        ),
    },
    {
        "id": "rooms_amenities",
        "category": "rooms",
        "title": "Room Amenities and Features",
        "text": (
            "All Grand Meridian rooms include high-speed WiFi (1 Gbps fibre), smart 4K OLED TV, Nespresso "
            "machine, mini-bar, rainfall shower, organic toiletries by Bamford, Egyptian cotton linens, "
            "and 24-hour room service. Higher-tier rooms additionally feature: jacuzzi (Ocean Deluxe and above), "
            "private plunge pool (Beach Villa, Penthouses), butler service (Horizon Wing floor 3+, all suites), "
            "beach_access (Coral Wing), kids_corner with toys and games (family suites in Palm Wing), "
            "study_desk with ergonomic chair (Horizon Wing), pool_access for rooms overlooking the family pool, "
            "and floor-to-ceiling glass walls (Penthouses). All suites include welcome amenities: "
            "champagne, tropical fruit basket, and handwritten welcome note."
        ),
    },
    {
        "id": "rooms_accessibility",
        "category": "rooms",
        "title": "Accessible Rooms and Special Needs",
        "text": (
            "Grand Meridian Resort is fully committed to accessibility. Four dedicated accessible rooms are "
            "available on the ground floor of each wing, featuring wider doorways (92cm), roll-in showers, "
            "grab rails, lowered furniture, and visual fire alarms. Wheelchair-accessible paths connect all "
            "resort areas including the beach via a specially constructed boardwalk. Guests with special dietary "
            "requirements, mobility needs, or medical conditions are encouraged to contact the resort in advance. "
            "Dedicated accessibility concierge service is available. Service animals are welcome. "
            "Sign language interpretation can be arranged with 48 hours' notice."
        ),
    },

    # ──────────────────────── DINING ────────────────────────
    {
        "id": "dining_overview",
        "category": "dining",
        "title": "Dining Overview",
        "text": (
            "Grand Meridian Resort features five distinct dining venues, each with its own culinary concept "
            "and atmosphere. Total seating capacity across all venues is 450. The resort employs 12 chefs "
            "including Executive Chef Arjun Mehta, formerly of Nobu Tokyo and The Fat Duck. All menus "
            "emphasise locally sourced, sustainable ingredients from the resort's organic garden and "
            "relationships with local fishing communities. Meal plans available: Bed & Breakfast ($45/person/night), "
            "Half Board ($85/person/night), Full Board ($130/person/night). Room service runs 24/7."
        ),
    },
    {
        "id": "dining_reef_table",
        "category": "dining",
        "title": "The Reef Table",
        "text": (
            "The Reef Table is Grand Meridian's signature fine dining restaurant, perched on stilts above "
            "the ocean with 180-degree sea views. Open for dinner only (7 PM – 11 PM), it seats 60 guests. "
            "The menu is a celebration of coastal cuisine featuring live lobster, Wagyu beef, hand-dived "
            "scallops, and a 400-label wine cellar. Chef Arjun Mehta's tasting menu (7 courses, $185/person) "
            "is the highlight. Smart casual dress code required. Reservations highly recommended 48 hours in "
            "advance. Private dining room available for groups of up to 12."
        ),
    },
    {
        "id": "dining_palm_bistro",
        "category": "dining",
        "title": "Palm Garden Bistro",
        "text": (
            "Palm Garden Bistro is the resort's all-day dining restaurant set within the tropical gardens. "
            "Open 7 AM – 10 PM, it serves breakfast buffet (7–11 AM, $35/person), à la carte lunch and "
            "dinner with organic salads, wood-fired pizzas, pasta, and tropical grills. Vegan and gluten-free "
            "menus available. Family-friendly with a dedicated kids menu ($12/child). Seats 120 indoors "
            "and on the garden terrace. Live cooking stations at breakfast. Weekly Sunday Brunch with "
            "free-flow Prosecco ($65/person)."
        ),
    },
    {
        "id": "dining_horizon_lounge",
        "category": "dining",
        "title": "Horizon Sky Lounge",
        "text": (
            "Horizon Sky Lounge is the resort's rooftop bar and tapas restaurant on the 5th floor of the "
            "Horizon Wing. Open from 4 PM to midnight, it offers signature cocktails, craft beers, premium "
            "spirits, and an inventive tapas menu. Sunset hours (5–7 PM) are particularly popular with "
            "complimentary canapés. Live DJ on Friday and Saturday evenings. Private rooftop hire available "
            "for events. The 360-degree view encompasses the ocean, marina, and island silhouettes at dusk. "
            "Smart casual dress code. Minimum age 21 after 9 PM."
        ),
    },
    {
        "id": "dining_coral_grill",
        "category": "dining",
        "title": "Coral Beach Grill",
        "text": (
            "Coral Beach Grill is a barefoot-luxury beach restaurant serving fresh-catch BBQ, grilled seafood, "
            "burgers, and tropical smoothies. Open for lunch (12–4 PM) and sunset dinners (6–9 PM). Guests "
            "dine with toes in the sand under thatched umbrellas. Daily catch specials are written on a "
            "chalkboard and depend on what local fishermen bring in that morning. Frozen cocktails and "
            "fresh coconut water available. No reservations needed. Kids eat free on Sundays."
        ),
    },
    {
        "id": "dining_spice_route",
        "category": "dining",
        "title": "Spice Route Restaurant",
        "text": (
            "Spice Route is the resort's international flavours restaurant, celebrating the culinary heritage "
            "of the Silk Road — from Indian curries and Thai stir-fries to Middle Eastern mezze and "
            "Mediterranean grills. Open for dinner (6–10:30 PM). Features a live tandoor oven and a "
            "curated selection of Asian and European wines. Vegetarian and vegan options at every course. "
            "Weekly themed nights: Monday (Indian Night), Wednesday (Mediterranean Night), Friday (Pan-Asian Night). "
            "Seats 80. Popular with guests from the subcontinent and those seeking familiar flavours."
        ),
    },

    # ──────────────────────── SPA ────────────────────────
    {
        "id": "spa_overview",
        "category": "spa",
        "title": "The Meridian Spa",
        "text": (
            "The Meridian Spa is a 6,000 sq ft sanctuary of wellness spread across a dedicated spa pavilion "
            "surrounded by reflecting pools and fragrant frangipani gardens. Open daily 8 AM – 9 PM. "
            "The spa has 12 treatment rooms, 2 couples suites, a thermal suite (steam room, sauna, ice bath), "
            "a 25-metre indoor lap pool, yoga studio, and juice bar. Over 40 treatments are offered, blending "
            "traditional Ayurvedic rituals with modern spa science. The head therapist team trained at ESPA "
            "London and Six Senses. Spa packages can be pre-booked as add-ons to room reservations."
        ),
    },
    {
        "id": "spa_treatments",
        "category": "spa",
        "title": "Spa Treatments and Packages",
        "text": (
            "Signature treatments at Meridian Spa: Deep Ocean Massage (90 min, $180) uses volcanic hot stones "
            "and seaweed wraps to deeply relax muscles. Coral Reef Couples Spa (120 min, $320/couple) is "
            "the most popular honeymoon package with private room, champagne, and synchronised massage. "
            "Ayurvedic Rejuvenation (150 min, $220) follows traditional Shirodhara and Abhyanga protocols. "
            "Meridian Signature Facial (60 min, $120) uses marine collagen and vitamin C serums. "
            "The Sunrise Yoga & Detox Package ($95/person) includes morning yoga, green juice, and herbal wrap. "
            "The 3-Day Wellness Retreat ($850/person) covers spa treatments, yoga, nutrition sessions, "
            "and healthy dining. All products are organic, vegan, and cruelty-free."
        ),
    },

    # ──────────────────────── ACTIVITIES ────────────────────────
    {
        "id": "activities_water",
        "category": "activities",
        "title": "Water Sports and Marine Activities",
        "text": (
            "Grand Meridian Resort operates a full-service water sports centre on the beachfront, open daily "
            "8 AM – 6 PM. Activities: Scuba Diving (certified divers $85/dive, beginner discover course $120, "
            "PADI certification $350 over 4 days), Snorkelling tours to the coral reef ($45/person, 2 hours), "
            "Surfing lessons ($60/hour with instructor), Jet Ski rental ($80/30 min), Kayaking (single $20/hour, "
            "double $30/hour), Parasailing ($75/person), Stand-up paddleboarding ($25/hour), "
            "Deep Sea Fishing charter ($250/half day, up to 4 people). Equipment hire and safety gear provided. "
            "Night snorkelling ($65/person) available on calm nights."
        ),
    },
    {
        "id": "activities_land",
        "category": "activities",
        "title": "Land Activities and Tours",
        "text": (
            "Land-based activities at Grand Meridian: Daily sunrise and sunset yoga on the beach (complimentary "
            "for all guests), Pilates and aqua aerobics in the pool, Cycling tours of the fishing village "
            "($35/person, 3 hours), Village cultural walk with local guide ($25/person), Golf at the "
            "championship course 15 minutes away (transfers arranged, $150 green fees), Tennis courts "
            "(complimentary), Beach volleyball, Coconut cooking class with Chef Arjun ($95/person, "
            "3 hours including dinner), Beachside cinema on Friday evenings (complimentary). "
            "Kids Club (ages 4–12, 9 AM – 6 PM) offers supervised activities, arts and crafts, "
            "beach treasure hunts, and mini water sports for children."
        ),
    },
    {
        "id": "activities_tours",
        "category": "activities",
        "title": "Excursions and Day Tours",
        "text": (
            "Curated resort excursions: Helicopter Island Tour ($450/person, 45 min) offering aerial views "
            "of the coastline, reefs, and jungle interior — the most popular premium experience at the resort. "
            "Island Hopping Day Trip ($120/person) visits 3 uninhabited islands with picnic lunch and "
            "snorkelling. Mangrove Safari by kayak ($55/person, 2.5 hours) explores the protected estuary. "
            "Lighthouse Tour ($30/person) visits the historic 1887 lighthouse with sunset views. "
            "Local Market & Spice Tour ($40/person, half day). Whale Watching Cruise (seasonal, "
            "Dec–March, $95/person). Private yacht charter (half day $600, full day $1100, up to 8 guests). "
            "All tours depart from the resort pier and include return transfers."
        ),
    },

    # ──────────────────────── POOLS ────────────────────────
    {
        "id": "pools",
        "category": "facilities",
        "title": "Swimming Pools",
        "text": (
            "Grand Meridian Resort has four swimming pools: The Infinity Pool (main pool, 50m, adults only, "
            "open 7 AM – 10 PM) overlooks the ocean and is the most photographed feature of the resort. "
            "The Family Pool (25m, heated, splash zone for kids) adjacent to Palm Wing is open 7 AM – 8 PM. "
            "The Horizon Rooftop Plunge Pool (15m, adults only, open 8 AM – midnight) is exclusive to "
            "Horizon Wing guests. Individual room plunge pools are available in Beach Villas and Penthouses. "
            "Pool towels provided at all poolside stations. Poolside bar service at the main infinity pool "
            "and family pool (10 AM – 6 PM). Pool loungers are complimentary (no reservations taken — "
            "first come, first served)."
        ),
    },

    # ──────────────────────── BEACH ────────────────────────
    {
        "id": "beach",
        "category": "facilities",
        "title": "Private Beach",
        "text": (
            "Grand Meridian Resort's private beach stretches 400 metres and is exclusively for resort guests. "
            "The beach is cleaned daily at 6 AM and again at 6 PM. Complimentary beach chairs and umbrellas "
            "are available (on a first-come basis). Coral Beach Grill serves food and beverages directly on "
            "the sand. Water sports equipment hire is operated from the beach hut. The beach is Blue Flag "
            "certified for water quality and environmental management. Lifeguards are on duty 8 AM – 6 PM. "
            "Swimming is safe year-round; the best conditions are between November and April. "
            "A dedicated sunrise walk guide leads a 45-minute beach walk at 6:30 AM every morning."
        ),
    },

    # ──────────────────────── EVENTS & WEDDINGS ────────────────────────
    {
        "id": "events_weddings",
        "category": "events",
        "title": "Weddings and Special Events",
        "text": (
            "Grand Meridian Resort is one of the region's most sought-after wedding destinations. "
            "The resort offers beachside ceremonies at sunset, garden gazebo weddings, and elegant "
            "ballroom receptions. The Grand Ballroom seats 300 guests for dinner. Smaller venues include "
            "the Reef Terrace (80 guests, ocean view), Palm Garden Pavilion (150 guests), and the intimate "
            "Lighthouse Deck (30 guests). Wedding packages start from $8,000 for an intimate ceremony. "
            "A dedicated wedding coordinator, florist, and pastry chef are part of every package. "
            "The resort hosts on average 3 weddings per week and is booked 18 months in advance for peak "
            "season (December–January). Corporate events, conferences, and team retreats also accommodated."
        ),
    },

    # ──────────────────────── KIDS CLUB ────────────────────────
    {
        "id": "kids_club",
        "category": "facilities",
        "title": "Kids Club and Family Services",
        "text": (
            "The Meridian Kids Club operates daily 9 AM – 6 PM for children aged 4–12. Activities include "
            "junior snorkelling, beach treasure hunts, coconut painting, sandcastle competitions, "
            "junior cooking classes, and evening movie nights. The club is supervised by certified "
            "childcare professionals with a 1:4 staff-to-child ratio. Kids Club is complimentary for "
            "guests staying in Palm Wing family rooms. For other rooms, the daily rate is $30/child. "
            "Baby sitting service available 6 PM – midnight ($20/hour, 24 hours advance booking). "
            "Baby cribs, high chairs, and bottle sterilisers available on request at no charge. "
            "A children's menu is available at all resort restaurants."
        ),
    },

    # ──────────────────────── POLICIES ────────────────────────
    {
        "id": "policies_checkin",
        "category": "policies",
        "title": "Check-in, Check-out and General Policies",
        "text": (
            "Standard check-in time is 3:00 PM. Early check-in from 12 PM is available subject to room "
            "availability (no charge). Check-out time is 11:00 AM. Late check-out until 2 PM is available "
            "for a fee of 50% of daily rate; full-day late check-out (until 6 PM) is 100% of daily rate. "
            "Luggage storage is complimentary before check-in and after check-out. "
            "Complimentary welcome drink and cool towel on arrival. Express checkout available via mobile app. "
            "Minimum stay 2 nights during peak season (December 20 – January 5). "
            "Maximum occupancy strictly enforced as per room type."
        ),
    },
    {
        "id": "policies_cancellation",
        "category": "policies",
        "title": "Cancellation and Payment Policy",
        "text": (
            "Cancellation policy: Free cancellation up to 48 hours before check-in date. "
            "Cancellations within 48 hours of check-in forfeit the first night's payment. "
            "No-shows are charged 100% of the total booking. Peak season bookings (December 20 – January 5 "
            "and public holidays) require 7 days' notice for free cancellation. "
            "Payment is accepted via all major credit cards (Visa, Mastercard, Amex), bank transfer, "
            "and UPI. Deposits: 30% deposit required at booking; balance due 7 days before arrival "
            "for peak season, or at check-in for off-peak. Currency: USD and local currency accepted. "
            "Prices include all applicable taxes and service charges."
        ),
    },
    {
        "id": "policies_pets_smoking",
        "category": "policies",
        "title": "Pet Policy, Smoking Policy, and Other Rules",
        "text": (
            "Pets: Service animals are welcome throughout the resort with appropriate documentation. "
            "Pet dogs (up to 10 kg) are permitted in Beach Villas only with a $50/night pet fee and "
            "advance arrangement. No other pets permitted. "
            "Smoking: Grand Meridian is a predominantly non-smoking resort. Smoking is permitted only on "
            "private room balconies and in the designated smoking area near the west gate. "
            "Smoking in any other area incurs a $200 deep-cleaning fee. "
            "Noise: Quiet hours are 10 PM – 8 AM. Rooms with persistent noise complaints may be asked to leave. "
            "Parties/gatherings in rooms limited to registered guests only. "
            "Dress code: Smart casual for The Reef Table and Horizon Sky Lounge after 6 PM."
        ),
    },

    # ──────────────────────── TRANSPORT ────────────────────────
    {
        "id": "transport",
        "category": "location",
        "title": "Location, Transfers and Transport",
        "text": (
            "Grand Meridian Resort is located on the southern coastline, 45 km from the international airport. "
            "Complimentary airport transfers are included for all bookings of 3 nights or more (sedan for "
            "2 guests; minivan for 3+ guests). Transfer time: approximately 45 minutes. "
            "Private helicopter transfers available for a premium experience ($350 per flight, 12 minutes). "
            "Resort shuttle: free shuttle to the local town every 2 hours (8 AM – 8 PM). "
            "Car rental desk in the lobby. Bicycle hire available ($15/day). Resort tuk-tuks for internal "
            "transport between wings (complimentary). Valet parking complimentary for all guests with vehicles. "
            "Nearest town 8 km away with local shops, hospital, and ATMs."
        ),
    },

    # ──────────────────────── SUSTAINABILITY ────────────────────────
    {
        "id": "sustainability",
        "category": "sustainability",
        "title": "Sustainability and Eco-Initiatives",
        "text": (
            "Grand Meridian Resort holds a Green Globe Certification and is committed to net-zero carbon "
            "operations by 2030. Key initiatives: 100% solar-powered hot water systems, solar panels supply "
            "40% of electricity needs, rainwater harvesting for garden irrigation, single-use plastic "
            "eliminated resort-wide since 2022, on-site organic vegetable garden supplying 30% of "
            "restaurant produce, coral reef restoration programme (Meridian Marine Foundation has replanted "
            "over 5,000 coral fragments since 2019), mangrove conservation partnership, sea turtle nesting "
            "monitoring, electric buggies for internal transport, composting all food waste. "
            "A $2/night sustainability contribution is added to every booking and goes directly to "
            "conservation programmes."
        ),
    },

    # ──────────────────────── LOYALTY PROGRAMME ────────────────────────
    {
        "id": "loyalty",
        "category": "loyalty",
        "title": "Meridian Loyalty Programme",
        "text": (
            "The Meridian Loyalty Programme rewards returning guests. Tiers: Bronze (1st stay) → Silver "
            "(3 stays) → Gold (7 stays) → Diamond (15+ stays). Bronze benefits: 5% discount on dining. "
            "Silver: 10% dining, priority check-in, room upgrade when available. Gold: 15% all services, "
            "guaranteed room upgrade, late checkout, welcome gift. Diamond: 20% all services, guaranteed "
            "suite upgrade, dedicated concierge, complimentary airport transfer, annual 2-night free stay. "
            "Loyalty points earned: 10 points per $1 spent. Points redeemable for room upgrades, dining "
            "credits, spa treatments, and activity bookings. Loyalty card issued at first stay and "
            "updated automatically. Points never expire as long as one stay per 2 years."
        ),
    },

    # ──────────────────────── CONNECTIVITY ────────────────────────
    {
        "id": "connectivity",
        "category": "facilities",
        "title": "WiFi, Technology and Business Centre",
        "text": (
            "Grand Meridian Resort provides complimentary high-speed WiFi (1 Gbps fibre) throughout the "
            "property including all rooms, restaurants, pool areas, and beach. WiFi password is provided "
            "at check-in; network name: GrandMeridian_Guest. Business Centre (open 24/7) has 6 iMac "
            "workstations, high-speed printing, scanning, and a video conferencing suite (Zoom, Teams, "
            "Google Meet). Meeting rooms: 3 rooms for groups of 8–25, equipped with AV systems, "
            "whiteboards, and catering. Smart TVs in all rooms support Netflix, Disney+, YouTube, "
            "Apple AirPlay and Google Cast. International plug adaptors provided in all rooms. "
            "Mobile phone charging stations at the beach, pool, and lobby."
        ),
    },

    # ──────────────────────── HEALTH ────────────────────────
    {
        "id": "health_safety",
        "category": "health",
        "title": "Health, Safety and Medical Facilities",
        "text": (
            "Guest safety is the highest priority at Grand Meridian Resort. On-site medical clinic open "
            "daily 8 AM – 8 PM with a resident nurse. Doctor on call 24/7 for emergencies. Nearest hospital "
            "is 12 km away (20 min by resort vehicle). AED (defibrillator) units placed at the beach, "
            "pool, lobby, and each wing entrance. Trained first-aiders in all activity teams. "
            "Food allergen menu available at all restaurants; kitchen team trained in severe allergy protocols. "
            "All water sports equipment meets international safety standards. Sun safety stations (SPF 50 "
            "sunscreen dispensers) located at the beach and pool. Lifeguards on duty at beach and main pool "
            "8 AM – 6 PM. In-room safe available in all rooms. 24-hour security on the property."
        ),
    },

    # ──────────────────────── CONCIERGE SERVICES ────────────────────────
    {
        "id": "concierge_services",
        "category": "services",
        "title": "Concierge and Guest Services",
        "text": (
            "Grand Meridian's concierge team is available 24/7 at the lobby desk and via the in-room tablet. "
            "Services offered: tour and activity bookings, restaurant reservations (in-resort and nearby), "
            "floral arrangements and celebration setups, cake and champagne orders, private butler requests, "
            "laundry and dry cleaning (24-hour service, $5–25/item), shoe cleaning, newspaper delivery, "
            "currency exchange, postal services, car rental and taxi arrangements, personalised itinerary "
            "planning, surprise room setups for anniversaries/birthdays, photography sessions on the beach "
            "($150/hour with professional photographer). The concierge also manages priority restaurant "
            "reservations and can arrange private dining on the beach ($300 setup, exclusive use of "
            "a beachside gazebo for 2 hours)."
        ),
    },
]


def get_all_documents() -> list[dict]:
    """Return all hotel knowledge base documents."""
    return HOTEL_DOCUMENTS


def get_document_texts() -> list[str]:
    """Return just the text content for embedding."""
    return [doc["text"] for doc in HOTEL_DOCUMENTS]


def get_document_metadata() -> list[dict]:
    """Return metadata for each document (without the text)."""
    return [
        {"id": doc["id"], "category": doc["category"], "title": doc["title"]}
        for doc in HOTEL_DOCUMENTS
    ]
