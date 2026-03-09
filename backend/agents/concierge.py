"""Concierge Agent — the main orchestrator that routes to worker agents."""
import json
from agents.base import BaseAgent
from agents.booking import BookingAgent
from agents.recommendation import RecommendationAgent

booking_agent = BookingAgent()
recommendation_agent = RecommendationAgent()

CONCIERGE_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "route_to_booking",
            "description": "Route the guest's request to the Booking Agent for room search, availability check, creating bookings, cancelling bookings, or looking up booking details.",
            "parameters": {
                "type": "object",
                "properties": {
                    "guest_message": {"type": "string", "description": "The guest's request rewritten clearly for the booking agent"},
                },
                "required": ["guest_message"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "route_to_recommendation",
            "description": "Route to the Recommendation Agent when the guest needs personalized room suggestions based on preferences, occasion, or budget.",
            "parameters": {
                "type": "object",
                "properties": {
                    "guest_message": {"type": "string", "description": "The guest's request rewritten clearly for the recommendation agent"},
                },
                "required": ["guest_message"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "provide_resort_info",
            "description": "Answer general questions about the resort: amenities, dining, activities, policies, location, etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {"type": "string", "description": "The topic the guest is asking about"},
                },
                "required": ["topic"],
            },
        },
    },
]

CONCIERGE_PROMPT = """You are the AI Concierge for **Grand Meridian Resort** — a luxury oceanfront resort.

🌊 You are the guest's first point of contact. Be warm, welcoming, and helpful.

Your role:
1. **Greet** guests and understand their needs
2. **Route** requests to the right specialist agent
3. **Present** information with clickable quick-reply options
4. **Guide** guests through the booking flow step by step

RESORT OVERVIEW:
- Grand Meridian Resort sits on a pristine beach with crystal-clear waters
- 4 Wings: Coral (oceanfront), Horizon (panoramic/premium), Palm (family/garden), Reef (marina/sunset)
- 120 rooms from $150/night Classic to $3000/night Penthouse
- Amenities: infinity pools, private beach, world-class spa, 5 restaurants, water sports, kids club
- Activities: scuba diving, surfing, kayaking, jet skiing, fishing, helicopter tours, island hopping

BOOKING FLOW — Guide guests through these steps:
1. Ask for dates (check-in / check-out)
2. Ask about preferences (view, budget, occasion, guests)
3. Show available rooms (route to booking/recommendation agent)
4. Guest selects a room
5. Collect guest details (name, email, phone)
6. Confirm and create booking
7. Share booking reference

RESPONSE FORMAT:
Always include `quick_replies` — 2-5 clickable options that guide the conversation forward.
Format your response as JSON with:
{
    "message": "Your friendly response text",
    "quick_replies": ["Option 1", "Option 2", "Option 3"],
    "action": null or "navigate_3d" or "show_room" or "start_booking" or "show_availability"
}

IMPORTANT:
- Keep responses concise but warm
- Use the guest's name if known
- Always offer quick reply options to keep the conversation flowing
- Suggest the 3D resort viewer for visual room browsing
- For bookings, collect ALL required info before creating"""


class ConciergeAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="ConciergeAgent",
            system_prompt=CONCIERGE_PROMPT,
            tools=CONCIERGE_TOOLS,
        )

    def get_tool_handlers(self, db, conversation_history: list):
        async def handle_booking_route(args: dict) -> dict:
            # Only pass user/assistant content messages — no tool_calls
            clean_history = [
                {"role": m["role"], "content": m["content"]}
                for m in conversation_history
                if m.get("role") in ("user", "assistant") and m.get("content")
            ]
            clean_history.append({"role": "user", "content": args["guest_message"]})
            result = await booking_agent.process(clean_history, db)
            return {"agent_response": result["content"]}

        async def handle_recommendation_route(args: dict) -> dict:
            clean_history = [
                {"role": m["role"], "content": m["content"]}
                for m in conversation_history
                if m.get("role") in ("user", "assistant") and m.get("content")
            ]
            clean_history.append({"role": "user", "content": args["guest_message"]})
            result = await recommendation_agent.process(clean_history, db)
            return {"agent_response": result["content"]}

        async def handle_resort_info(args: dict) -> dict:
            topic = args.get("topic", "general")
            info = {
                "dining": {
                    "restaurants": [
                        "The Reef Table — Fine dining seafood, ocean view",
                        "Palm Garden Bistro — Farm-to-table organic cuisine",
                        "Horizon Sky Lounge — Rooftop cocktails and tapas",
                        "Coral Beach Grill — Casual beachside BBQ and fresh catch",
                        "Spice Route — International flavors and local delicacies",
                    ],
                    "note": "Room service available 24/7. Full board and half board meal plans available."
                },
                "spa": {
                    "treatments": ["Deep Ocean Massage", "Coral Reef Couples Spa", "Ayurvedic Rejuvenation", "Hot Stone Therapy"],
                    "hours": "8 AM - 9 PM daily",
                    "note": "Can be booked as add-on to your stay."
                },
                "activities": {
                    "water_sports": ["Scuba Diving", "Surfing", "Jet Skiing", "Kayaking", "Parasailing", "Deep Sea Fishing"],
                    "land": ["Yoga", "Golf (nearby)", "Village Cultural Walk", "Cycling"],
                    "tours": ["Island Hopping", "Helicopter Ride", "Mangrove Safari", "Lighthouse Tour"],
                },
                "policies": {
                    "check_in": "3:00 PM",
                    "check_out": "11:00 AM",
                    "cancellation": "Free cancellation up to 48 hours before check-in",
                    "children": "Children under 5 stay free. Kids club for ages 4-12.",
                    "pets": "Service animals only",
                },
                "location": {
                    "description": "Perched on a pristine stretch of coastline with direct beach access. Near coral reefs, mangrove forests, and a charming fishing marina.",
                    "airport": "45 minutes from international airport (transfer available)",
                    "nearby": "Marina, fishing village, lighthouse, mangrove forest, coral reef",
                },
            }
            return info.get(topic, {"info": f"Grand Meridian Resort is a luxury beachfront property with world-class amenities across 4 unique wings.", "topics_available": list(info.keys())})

        return {
            "route_to_booking": handle_booking_route,
            "route_to_recommendation": handle_recommendation_route,
            "provide_resort_info": handle_resort_info,
        }

    async def process(self, messages: list[dict], db) -> dict:
        """Process a guest message and return structured response."""
        handlers = self.get_tool_handlers(db, messages)
        result = await self.chat_with_tool_execution(messages, handlers)

        # Try to parse structured JSON response
        content = result.get("content", "")
        try:
            # Try to extract JSON from the response
            if "{" in content and "}" in content:
                json_start = content.index("{")
                json_end = content.rindex("}") + 1
                parsed = json.loads(content[json_start:json_end])
                return {
                    "message": parsed.get("message", content),
                    "quick_replies": parsed.get("quick_replies", []),
                    "action": parsed.get("action"),
                }
        except (json.JSONDecodeError, ValueError):
            pass

        # Fallback: return plain text with default quick replies
        return {
            "message": content,
            "quick_replies": [
                "Search rooms",
                "Get recommendations",
                "Resort information",
                "I have a booking",
            ],
            "action": None,
        }


# Singleton instance
concierge = ConciergeAgent()
