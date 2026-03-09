"""Recommendation Agent — suggests rooms based on guest preferences."""
import json
from datetime import date
from agents.base import BaseAgent
from db.queries import get_available_rooms

RECOMMEND_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_recommendations",
            "description": "Get personalized room recommendations based on guest preferences, budget, and dates.",
            "parameters": {
                "type": "object",
                "properties": {
                    "check_in": {"type": "string", "description": "Check-in date YYYY-MM-DD"},
                    "check_out": {"type": "string", "description": "Check-out date YYYY-MM-DD"},
                    "budget_max": {"type": "number", "description": "Maximum budget per night in USD"},
                    "preferred_view": {"type": "string", "description": "ocean, garden, pool, beach, sunset, marina"},
                    "preferred_floor": {"type": "string", "description": "high (4-5), middle (2-3), low (1)", "enum": ["high", "middle", "low"]},
                    "num_guests": {"type": "integer", "description": "Number of guests"},
                    "occasion": {"type": "string", "description": "Trip occasion: honeymoon, family, business, anniversary, solo, friends"},
                    "priorities": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "What matters most: view, space, price, amenities, quietness, beach_access"
                    },
                },
                "required": ["check_in", "check_out"],
            },
        },
    },
]

RECOMMEND_PROMPT = """You are the Recommendation Agent for Grand Meridian Resort.
Your role is to suggest the BEST rooms based on guest preferences, making personalized recommendations.

Resort knowledge:
- Coral Wing: Best for ocean lovers, direct beach access, sound of waves
- Horizon Wing: Best panoramic views, premium/penthouse tier, great for special occasions
- Palm Wing: Best for families, surrounded by tropical gardens, pool access, kids amenities
- Reef Wing: Best sunsets, marina views, exclusive feel, yacht watching

Room tips:
- Honeymoons: Sunset Suite, Beach Villa, or Penthouse with jacuzzi
- Families: Palm Wing suites with kids_corner, pool views
- Business: Horizon Wing with study_desk, good wifi
- Budget: Floor 1 Classic/Superior rooms ($150-270)
- Luxury: Penthouses ($2000+), Presidential ($1500+)
- Ocean views: Coral Wing floors 3-5 or Horizon Wing
- Quiet: Palm Wing garden-facing or high floors

When recommending:
- Suggest top 3 rooms with clear reasoning
- Highlight what makes each special for THEIR specific needs
- Mention price, view, and standout amenities
- Suggest they use the 3D viewer to walk through the resort
- If budget is tight, find creative value options"""


class RecommendationAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="RecommendationAgent",
            system_prompt=RECOMMEND_PROMPT,
            tools=RECOMMEND_TOOLS,
        )

    def get_tool_handlers(self, db):
        async def handle_recommendations(args: dict) -> dict:
            check_in = date.fromisoformat(args["check_in"])
            check_out = date.fromisoformat(args["check_out"])

            # Get all available rooms
            rooms = await get_available_rooms(
                db, check_in, check_out,
                view_type=args.get("preferred_view"),
                max_price=args.get("budget_max"),
                capacity=args.get("num_guests"),
            )

            # Score rooms based on preferences
            scored = []
            occasion = args.get("occasion", "")
            priorities = args.get("priorities", [])
            preferred_floor = args.get("preferred_floor", "")

            for r in rooms:
                score = 50  # base

                # Floor preference
                if preferred_floor == "high" and r.floor >= 4:
                    score += 20
                elif preferred_floor == "middle" and 2 <= r.floor <= 3:
                    score += 20
                elif preferred_floor == "low" and r.floor == 1:
                    score += 20

                # Occasion bonuses
                amenities = r.amenities or []
                if occasion == "honeymoon":
                    if "jacuzzi" in amenities: score += 25
                    if r.view_type in ("sunset", "ocean_panoramic"): score += 20
                    if "butler" in amenities: score += 15
                elif occasion == "family":
                    if "kids_corner" in amenities: score += 30
                    if "pool_access" in amenities: score += 20
                    if r.capacity >= 4: score += 15
                elif occasion == "business":
                    if "study_desk" in amenities: score += 25
                    if r.floor >= 3: score += 10

                # Priority bonuses
                if "view" in priorities and r.view_type in ("ocean_panoramic", "ocean", "sunset"):
                    score += 20
                if "space" in priorities and r.capacity >= 4:
                    score += 15
                if "price" in priorities:
                    score += max(0, 30 - float(r.base_price) / 100)
                if "beach_access" in priorities and "beach_access" in amenities:
                    score += 25
                if "quietness" in priorities and r.floor >= 3:
                    score += 15

                scored.append((score, r))

            scored.sort(key=lambda x: -x[0])
            top = scored[:5]

            return {
                "total_available": len(rooms),
                "recommendations": [
                    {
                        "rank": i + 1,
                        "score": s,
                        "id": r.id, "room_name": r.room_name, "room_number": r.room_number,
                        "floor": r.floor, "view_type": r.view_type,
                        "capacity": r.capacity, "base_price": float(r.base_price),
                        "amenities": r.amenities, "description": r.description,
                    }
                    for i, (s, r) in enumerate(top)
                ],
            }

        return {"get_recommendations": handle_recommendations}

    async def process(self, messages: list[dict], db) -> dict:
        handlers = self.get_tool_handlers(db)
        return await self.chat_with_tool_execution(messages, handlers)
