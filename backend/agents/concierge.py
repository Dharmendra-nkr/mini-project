"""Concierge Agent — the main orchestrator that routes to worker agents."""
import json
import logging
from .base import BaseAgent
from .booking import BookingAgent
from .recommendation import RecommendationAgent
from backend.rag.retriever import query_knowledge, infer_category

logger = logging.getLogger(__name__)

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
            "description": "Answer ANY general question about the resort using the knowledge base: dining, spa, activities, pools, beach, events, weddings, sustainability, loyalty programme, transport, policies, WiFi, kids club, and more. The tool performs semantic retrieval to find the most relevant information.",
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {"type": "string", "description": "The specific topic the guest is asking about (e.g. 'spa massage prices', 'kids club hours', 'cancellation policy', 'helicopter tour', 'wedding packages')"},
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
- For bookings, collect ALL required info before creating
- When provide_resort_info returns "retrieved_context", use ONLY that context to answer — it comes from our verified knowledge base
- Include specific details (prices, times, durations) from the retrieved context in your response"""


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
            """
            RAG-powered resort information handler.
            Performs semantic vector search over the hotel knowledge base
            to find the most relevant information for the guest's question.
            """
            topic = args.get("topic", "general")

            # Infer document category for more precise retrieval
            category = infer_category(topic)

            # Build query variants for better recall
            extra_queries = []
            if "price" in topic.lower() or "cost" in topic.lower():
                extra_queries.append(f"How much does {topic} cost at Grand Meridian")
            if "how" in topic.lower():
                extra_queries.append(f"Grand Meridian Resort {topic} details")

            # Semantic retrieval from vector store
            context = query_knowledge(
                query=f"Grand Meridian Resort {topic}",
                top_k=4,
                category=category,
                extra_queries=extra_queries if extra_queries else None,
            )

            if not context:
                # Fallback if RAG not yet initialised
                logger.warning("RAG returned empty context — using fallback info.")
                return {
                    "info": (
                        "Grand Meridian Resort is a luxury 5-star beachfront property with 120 rooms "
                        "across 4 wings (Coral, Horizon, Palm, Reef). Amenities include infinity pools, "
                        "private beach, world-class spa, 5 restaurants, and full water sports centre."
                    ),
                    "topic": topic,
                    "source": "fallback",
                }

            logger.info(
                f"RAG retrieved {len(context.split('[Source'))-1} chunks "
                f"for topic='{topic}' category='{category}'"
            )

            return {
                "topic": topic,
                "retrieved_context": context,
                "instruction": (
                    "Use ONLY the retrieved_context above to answer the guest's question. "
                    "Be specific, warm, and include relevant prices, times, or details. "
                    "Do not make up information not present in the context."
                ),
                "source": "vector_rag",
            }

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
