"""Base agent class with Groq LLM client (OpenAI-compatible)."""
from openai import AsyncOpenAI
from config import settings
import json

# Groq client using OpenAI SDK
groq_client = AsyncOpenAI(
    api_key=settings.groq_api_key,
    base_url="https://api.groq.com/openai/v1",
)

MODEL = "llama-3.3-70b-versatile"


class BaseAgent:
    """Base class for all AI agents."""

    def __init__(self, name: str, system_prompt: str, tools: list[dict] = None):
        self.name = name
        self.system_prompt = system_prompt
        self.tools = tools or []

    async def chat(self, messages: list[dict], **kwargs) -> dict:
        """Send messages to Groq and get a response."""
        full_messages = [{"role": "system", "content": self.system_prompt}] + messages

        params = {
            "model": MODEL,
            "messages": full_messages,
            "temperature": 0.7,
            "max_tokens": 1024,
        }
        if self.tools:
            params["tools"] = self.tools
            params["tool_choice"] = "auto"

        response = await groq_client.chat.completions.create(**params)
        return response.choices[0].message

    async def chat_with_tool_execution(
        self, messages: list[dict], tool_handlers: dict, **kwargs
    ) -> dict:
        """Chat with automatic tool call execution loop."""
        current_messages = list(messages)

        for _ in range(5):  # max tool call rounds
            response = await self.chat(current_messages, **kwargs)

            if not response.tool_calls:
                return {
                    "content": response.content,
                    "role": "assistant",
                }

            # Add assistant message with tool calls
            current_messages.append({
                "role": "assistant",
                "content": response.content or "",
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        },
                    }
                    for tc in response.tool_calls
                ],
            })

            # Execute each tool call
            for tool_call in response.tool_calls:
                fn_name = tool_call.function.name
                fn_args = json.loads(tool_call.function.arguments)

                if fn_name in tool_handlers:
                    try:
                        result = await tool_handlers[fn_name](fn_args)
                    except Exception as e:
                        result = {"success": False, "error": f"Tool execution failed: {str(e)}"}
                else:
                    result = {"error": f"Unknown function: {fn_name}"}

                current_messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(result, default=str),
                })

        # If we exhausted tool rounds, get a final response
        final = await self.chat(current_messages)
        return {"content": final.content, "role": "assistant"}
