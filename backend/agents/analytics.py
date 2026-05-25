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

For trends (e.g., revenue over time), use type: "line" and data: [{"label": "Month", "value": Revenue}]
For ratios (e.g., booking status), use type: "pie" and data: [{"label": "Status", "value": Count}]
For distributions (e.g., ratings), use type: "histogram" and data: [{"label": "Rating Range", "value": Count}]
For comparisons (e.g., revenue by wing), use type: "bar" and data: [{"label": "Wing", "value": Revenue}]
Always include the chart block for these question types. Do not include any explanation inside the JSON block. Only include the chart block if a chart is relevant."""


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
        result = await self.chat_with_tool_execution(messages, handlers)
        # Try to extract chart data from the LLM response (if present)
        # Convention: LLM should return a JSON block with 'chart' key if chart is needed
        import re
        import json as pyjson
        chart = None
        content = result["content"]
        chart_match = re.search(r'```json\\n(.*?)```', content, re.DOTALL)
        if chart_match:
            try:
                chart_json = pyjson.loads(chart_match.group(1))
                if "chart" in chart_json:
                    chart = chart_json["chart"]
                    # Remove chart block from content
                    content = re.sub(r'```json\\n.*?```', '', content, flags=re.DOTALL).strip()
            except Exception:
                pass
        return {"content": content, "chart": chart, "role": "assistant"}
