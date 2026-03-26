"""Test manager analytics agent integration."""
import asyncio
import os
import sys
from datetime import datetime, timedelta

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

from agents.manager_analytics import ManagerAnalyticsAgent


async def test_manager_analytics():
    """Test basic functionality of ManagerAnalyticsAgent."""
    agent = ManagerAnalyticsAgent()
    
    # Test 1: Natural language query analysis
    print("=" * 60)
    print("TEST 1: Analyze natural language query")
    print("=" * 60)
    
    test_queries = [
        "What is the trend of our profit this month?",
        "Compare revenue by wing this month",
        "What is the share of revenue by room type?",
        "How many bookings do we have this week?",
    ]
    
    for test_query in test_queries:
        print(f"\nQuery: {test_query}")
        try:
            result = await agent.query(test_query, {"view_guest_pii": False})
            print(f"  Chart Type: {result.get('chart_type')}")
            print(f"  Title: {result.get('title')}")
            print(f"  SQL (first 100 chars): {result.get('sql', '')[:100]}")
        except Exception as e:
            print(f"  Error: {e}")
    
    # Test 2: Chart type detection
    print("\n" + "=" * 60)
    print("TEST 2: Chart type detection")
    print("=" * 60)
    
    test_cases = [
        ("trend", "line"),
        ("daily revenue growth", "line"),
        ("compare two wings", "bar"),
        ("breakdown by type", "bar"),
        ("share of bookings", "pie"),
        ("percentage by wing", "pie"),
        ("list all guests", "table"),
    ]
    
    for query, expected_type in test_cases:
        detected = agent._detect_chart_type(query)
        status = "✓" if detected == expected_type else "✗"
        print(f"{status} '{query}' -> {detected} (expected {expected_type})")
    
    # Test 3: Date range extraction
    print("\n" + "=" * 60)
    print("TEST 3: Date range extraction")
    print("=" * 60)
    
    date_tests = [
        "last month",
        "this week",
        "30 days",
        "90 days",
        "this year",
    ]
    
    for query in date_tests:
        start, end = agent._extract_date_range(query)
        print(f"'{query}' -> {start} to {end} (duration: {(end - start).days} days)")
    
    print("\n" + "=" * 60)
    print("All tests completed!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_manager_analytics())
