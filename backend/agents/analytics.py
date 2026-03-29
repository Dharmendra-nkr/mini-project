"""Analytics Agent — manager-only agent for business insights."""
import json
from .base import BaseAgent
from backend.db.queries import get_analytics_summary

ANALYTICS_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_resort_analytics",
            "description": "Get comprehensive resort analytics: revenue, occupancy, ratings, trends.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
]

ANALYTICS_PROMPT = """You are the Analytics Agent for Grand Meridian Resort management.
You provide business intelligence to resort managers.

When presenting data:
- Use clear numbers and percentages
- Highlight trends (up/down compared to previous periods)
- Flag any concerns (low occupancy, negative reviews)
- Suggest actionable insights
- Format data clearly with bullet points

You have access to: revenue data, occupancy rates, guest statistics, room performance, and seasonal trends."""


class AnalyticsAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="AnalyticsAgent",
            system_prompt=ANALYTICS_PROMPT,
            tools=ANALYTICS_TOOLS,
        )

    def get_tool_handlers(self, db):
        async def handle_analytics(args: dict) -> dict:
            return await get_analytics_summary(db)

        return {"get_resort_analytics": handle_analytics}

    async def process(self, messages: list[dict], db) -> dict:
        handlers = self.get_tool_handlers(db)
        return await self.chat_with_tool_execution(messages, handlers)
