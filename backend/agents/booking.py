"""Booking Agent — handles room search, availability, booking creation/cancellation."""
import json
from datetime import date, datetime
from agents.base import BaseAgent
from db.queries import (
    get_available_rooms, get_room_by_id, create_booking,
    cancel_booking, get_booking_by_ref, get_or_create_guest,
)

BOOKING_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_available_rooms",
            "description": "Search for available rooms at Grand Meridian Resort for specific dates. Returns rooms that are not booked.",
            "parameters": {
                "type": "object",
                "properties": {
                    "check_in": {"type": "string", "description": "Check-in date in YYYY-MM-DD format"},
                    "check_out": {"type": "string", "description": "Check-out date in YYYY-MM-DD format"},
                    "wing": {"type": "string", "description": "Wing name: Coral Wing, Horizon Wing, Palm Wing, or Reef Wing", "enum": ["Coral Wing", "Horizon Wing", "Palm Wing", "Reef Wing"]},
                    "view_type": {"type": "string", "description": "Preferred view", "enum": ["ocean", "ocean_panoramic", "garden", "pool", "beach", "sunset", "marina", "courtyard"]},
                    "min_price": {"type": "number", "description": "Minimum price per night in USD"},
                    "max_price": {"type": "number", "description": "Maximum price per night in USD"},
                    "capacity": {"type": "integer", "description": "Minimum guest capacity needed"},
                },
                "required": ["check_in", "check_out"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_room_details",
            "description": "Get detailed information about a specific room including amenities, photos, and reviews.",
            "parameters": {
                "type": "object",
                "properties": {
                    "room_id": {"type": "string", "description": "The room ID (number like 42) or room_number (like C103)"},
                },
                "required": ["room_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_booking",
            "description": "Create a new room booking for a guest. Requires guest info and room selection.",
            "parameters": {
                "type": "object",
                "properties": {
                    "room_id": {"type": "integer", "description": "The room ID to book"},
                    "check_in": {"type": "string", "description": "Check-in date YYYY-MM-DD"},
                    "check_out": {"type": "string", "description": "Check-out date YYYY-MM-DD"},
                    "guest_first_name": {"type": "string", "description": "Guest first name"},
                    "guest_last_name": {"type": "string", "description": "Guest last name"},
                    "guest_email": {"type": "string", "description": "Guest email address"},
                    "guest_phone": {"type": "string", "description": "Guest phone number"},
                    "num_guests": {"type": "integer", "description": "Number of guests"},
                    "special_requests": {"type": "string", "description": "Any special requests"},
                },
                "required": ["room_id", "check_in", "check_out", "guest_first_name", "guest_last_name", "guest_email"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "cancel_booking",
            "description": "Cancel an existing booking by its reference number (e.g., GM12345678).",
            "parameters": {
                "type": "object",
                "properties": {
                    "booking_ref": {"type": "string", "description": "The booking reference number starting with GM"},
                },
                "required": ["booking_ref"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "lookup_booking",
            "description": "Look up an existing booking by its reference number.",
            "parameters": {
                "type": "object",
                "properties": {
                    "booking_ref": {"type": "string", "description": "The booking reference number starting with GM"},
                },
                "required": ["booking_ref"],
            },
        },
    },
]

BOOKING_SYSTEM_PROMPT = """You are the Booking Agent for Grand Meridian Resort — a luxury beachfront resort. 
Your job is to help find available rooms, provide details, and create or cancel bookings.

Resort details:
- 4 Wings: Coral (oceanfront), Horizon (panoramic views), Palm (family/gardens), Reef (marina/sunset)
- 5 Floors per wing, 6 rooms per floor = 120 rooms total
- Room types: Classic, Superior, Deluxe, Ocean Deluxe, Garden Suite, Sunset Suite, Presidential Suite, Beach Villa, Coral Penthouse, Reef Penthouse
- Views: ocean, ocean_panoramic, garden, pool, beach, sunset, marina, courtyard
- Price range: $150 - $3000/night

BOOKING FLOW - Guide users through these steps:
1. **Collect Travel Dates**: Ask for check-in and check-out dates if not provided
2. **Understand Preferences**: Ask about budget, preferred view, wing, and capacity if needed
3. **Search Rooms**: Call search_available_rooms with the collected details
4. **Present Options**: Show top 3-5 room options with name, wing, view, price, and key amenities
5. **Get Room Selection**: Ask which room they prefer (by name or ID)
6. **IMPORTANT - Get Room Details**: When user specifies a room (e.g. "R302" or "Reef Deluxe"), FIRST call get_room_details with that room number to get the room ID
7. **Get Guest Details**: Name, email, phone number, number of guests, special requests
8. **Confirm & Book**: Summarize booking details and call create_booking with the numeric room_id from step 6
9. **Provide Reference**: Share booking reference (GM...) and booking confirmation details

CRITICAL: The create_booking function requires:
- room_id: INTEGER (obtained from get_room_details response)
- check_in/check_out: YYYY-MM-DD format
- guest names, email: required

When user selects a room:
- If they give a room number like "R302", "C103", etc., call get_room_details(room_number) to get the actual room_id
- Extract the "id" field from the response - this is what create_booking needs
- DO NOT guess or make up a room_id - always get it from get_room_details first

Example flow:
1. User: "Book the Reef Deluxe room R302"
2. Agent: Call get_room_details(room_id="R302")
3. Response includes: {"id": 42, "room_number": "R302", "room_name": "Reef Deluxe", ...}
4. Agent: Use room_id=42 when calling create_booking

When booking:
- Collect ALL required info: first name, last name, email, check-in, check-out, room_id
- Optional info: phone, num_guests, special_requests
- Confirm all details before creating the booking
- Provide the booking reference number (GM...) after creation with total price

BE PROACTIVE:
- If the guest mentions wanting to book, ask for dates first
- Don't wait for them to ask — guide the conversation forward
- Use natural language and be warm and professional
- Summarize options clearly before asking for selection
- Always confirm critical details before booking

EXAMPLE BOOKING FLOW:
1. Guest: "I want to book a room"
   Agent: "Excellent! I'd be happy to help. First, when would you like to check in and out? (YYYY-MM-DD format)"

2. Guest: "Check in March 28, check out March 31"
   Agent: "Perfect! Now, do you have preferences for: views (ocean/garden/sunset), budget per night, which wing, and how many guests?"

3. Guest: "Ocean view, around $500/night, 2 people"
   Agent: [CALLS search_available_rooms] "Great! Here are options: ..."

4. Guest: "I like room X"
   Agent: "Excellent! Now I need your details - first name, last name, email, phone?"

5. Guest: "John Smith, john@example.com, +1-555-1234"
   Agent: "Perfect! Let me confirm the booking then create it. [CALLS create_booking] ✓ Booking confirmed! Reference: GM..."

TONE: Warm, professional, proactive. Always guide the guest forward in the conversation."""


class BookingAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="BookingAgent",
            system_prompt=BOOKING_SYSTEM_PROMPT,
            tools=BOOKING_TOOLS,
        )

    def get_tool_handlers(self, db):
        """Return tool handler functions bound to a DB session."""
        async def handle_search(args: dict) -> dict:
            check_in = date.fromisoformat(args["check_in"])
            check_out = date.fromisoformat(args["check_out"])
            rooms = await get_available_rooms(
                db, check_in, check_out,
                wing=args.get("wing"),
                view_type=args.get("view_type"),
                min_price=args.get("min_price"),
                max_price=args.get("max_price"),
                capacity=args.get("capacity"),
            )
            return {
                "available_count": len(rooms),
                "rooms": [
                    {
                        "id": r.id, "room_number": r.room_number, "room_name": r.room_name,
                        "floor": r.floor, "view_type": r.view_type,
                        "capacity": r.capacity, "base_price": float(r.base_price),
                        "amenities": r.amenities, "description": r.description,
                    }
                    for r in rooms[:15]  # Limit results to avoid token overflow
                ],
            }

        async def handle_room_details(args: dict) -> dict:
            room_id = args["room_id"]
            # LLM sometimes passes room_number (string like "C103") instead of integer ID
            if isinstance(room_id, str) and not room_id.isdigit():
                from sqlalchemy import select
                from sqlalchemy.orm import selectinload
                from db.models import Room as RoomModel
                result = await db.execute(
                    select(RoomModel)
                    .options(selectinload(RoomModel.wing), selectinload(RoomModel.room_type), selectinload(RoomModel.reviews))
                    .where(RoomModel.room_number == room_id)
                )
                room = result.scalar_one_or_none()
            else:
                room = await get_room_by_id(db, int(room_id))
            if not room:
                return {"error": "Room not found"}
            reviews = room.reviews[:5] if room.reviews else []
            return {
                "id": room.id, "room_number": room.room_number, "room_name": room.room_name,
                "wing": room.wing.name, "floor": room.floor, "view_type": room.view_type,
                "capacity": room.capacity, "base_price": float(room.base_price),
                "amenities": room.amenities, "description": room.description,
                "room_type": room.room_type.name, "tier": room.room_type.tier,
                "photo_urls": room.photo_urls,
                "avg_rating": (
                    round(sum(r.overall_rating for r in reviews) / len(reviews), 1)
                    if reviews else None
                ),
                "review_count": len(room.reviews),
            }

        async def handle_create_booking(args: dict) -> dict:
            guest = await get_or_create_guest(
                db, args["guest_first_name"], args["guest_last_name"],
                args["guest_email"], args.get("guest_phone", ""),
            )
            booking = await create_booking(
                db, guest.id, args["room_id"],
                date.fromisoformat(args["check_in"]),
                date.fromisoformat(args["check_out"]),
                num_guests=args.get("num_guests", 1),
                special_requests=args.get("special_requests"),
            )
            return {
                "success": True,
                "booking_ref": booking.booking_ref,
                "total_price": float(booking.total_price),
                "check_in": str(booking.check_in),
                "check_out": str(booking.check_out),
                "status": booking.status,
            }

        async def handle_cancel(args: dict) -> dict:
            booking = await cancel_booking(db, args["booking_ref"])
            return {
                "success": True,
                "booking_ref": booking.booking_ref,
                "status": booking.status,
                "payment_status": booking.payment_status,
            }

        async def handle_lookup(args: dict) -> dict:
            booking = await get_booking_by_ref(db, args["booking_ref"])
            if not booking:
                return {"error": "Booking not found"}
            return {
                "booking_ref": booking.booking_ref,
                "guest_name": f"{booking.guest.first_name} {booking.guest.last_name}",
                "room_name": booking.room.room_name,
                "room_number": booking.room.room_number,
                "check_in": str(booking.check_in),
                "check_out": str(booking.check_out),
                "num_guests": booking.num_guests,
                "status": booking.status,
                "total_price": float(booking.total_price),
                "payment_status": booking.payment_status,
                "special_requests": booking.special_requests,
                "addons": [
                    {"name": a.addon_name, "type": a.addon_type, "price": float(a.price)}
                    for a in booking.addons
                ],
            }

        return {
            "search_available_rooms": handle_search,
            "get_room_details": handle_room_details,
            "create_booking": handle_create_booking,
            "cancel_booking": handle_cancel,
            "lookup_booking": handle_lookup,
        }

    async def process(self, messages: list[dict], db) -> dict:
        handlers = self.get_tool_handlers(db)
        return await self.chat_with_tool_execution(messages, handlers)
