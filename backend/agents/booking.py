"""Booking Agent — handles room search, availability, booking creation/cancellation."""
import json
from datetime import date, datetime
from .base import BaseAgent
from backend.db.queries import (
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
                    "wing": {"type": "string", "description": "Wing name: Coral, Horizon, Palm, or Reef", "enum": ["Coral", "Horizon", "Palm", "Reef"]},
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

When searching rooms:
- Always present results clearly with room name, type, wing, floor, view, price, and key amenities
- Highlight the best options based on the guest's preferences
- Mention the 3D resort viewer where they can see rooms visually

When booking:
- Confirm all details before creating the booking
- Provide the booking reference number (GM...) after creation
- Mention total price and check-in/check-out dates

Be warm, professional, and helpful. Use the guest's name when possible."""


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
                from db.models import Room as RoomModel
                result = await db.execute(
                    select(RoomModel).where(RoomModel.room_number == room_id)
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
            try:
                required = ["room_id", "check_in", "check_out", "guest_first_name", "guest_last_name", "guest_email"]
                missing = [k for k in required if k not in args]
                if missing:
                    return {"success": False, "error": f"Missing required fields: {', '.join(missing)}"}

                room_id = int(args["room_id"])
                check_in = date.fromisoformat(args["check_in"])
                check_out = date.fromisoformat(args["check_out"])

                if check_out <= check_in:
                    return {"success": False, "error": "Check-out date must be after check-in"}

                guest = await get_or_create_guest(
                    db, args["guest_first_name"], args["guest_last_name"],
                    args["guest_email"], args.get("guest_phone", ""),
                )
                booking = await create_booking(
                    db, guest.id, room_id, check_in, check_out,
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
            except ValueError as e:
                return {"success": False, "error": f"Invalid data: {str(e)}"}
            except Exception as e:
                return {"success": False, "error": f"Booking creation failed: {str(e)}"}

        async def handle_cancel(args: dict) -> dict:
            try:
                if "booking_ref" not in args:
                    return {"success": False, "error": "Missing booking_ref"}
                booking = await cancel_booking(db, args["booking_ref"])
                return {
                    "success": True,
                    "booking_ref": booking.booking_ref,
                    "status": booking.status,
                    "payment_status": booking.payment_status,
                }
            except ValueError as e:
                return {"success": False, "error": str(e)}
            except Exception as e:
                return {"success": False, "error": f"Cancel failed: {str(e)}"}

        async def handle_lookup(args: dict) -> dict:
            try:
                if "booking_ref" not in args:
                    return {"success": False, "error": "Missing booking_ref"}
                booking = await get_booking_by_ref(db, args["booking_ref"])
                if not booking:
                    return {"success": False, "error": "Booking not found"}
                return {
                    "success": True,
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
            except Exception as e:
                return {"success": False, "error": f"Lookup failed: {str(e)}"}

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
