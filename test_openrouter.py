"""Debug script to test OpenRouter API."""
import asyncio
from openai import AsyncOpenAI

async def test_openrouter():
    client =  AsyncOpenAI(
        api_key="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",
        base_url="https://openrouter.ai/api/v1",
    )
    
    print("Testing OpenRouter API...")
    print("Model: anthropic/claude-3.5-sonnet\n")
    
    try:
        response = await client.chat.completions.create(
            model="anthropic/claude-3.5-sonnet",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Hello! Are you working?"},
            ],
            temperature=0.7,
            max_tokens=100,
        )
        print("✅ SUCCESS!")
        print(f"Response: {response.choices[0].message.content}")
    except Exception as e:
        print(f"❌ Error: {type(e).__name__}")
        print(f"Details: {str(e)[:500]}")

if __name__ == "__main__":
    asyncio.run(test_openrouter())
