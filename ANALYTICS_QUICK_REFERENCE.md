# Manager Analytics System - Quick Reference

## 📍 API Endpoints

### 1. Analytics Chat (Main Endpoint)
```
POST /api/manager/analytics/chat?message=<query>&session_id=<optional_uuid>
Authorization: Bearer <jwt_token>
```

**Query Examples:**
- "What is the trend of our profit this month?"
- "Compare revenue by wing"
- "How many bookings do we have by room type?"
- "Show me the occupancy rate for last 30 days"
- "What's the guest satisfaction trend?"

**Response:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "query_id": 42,
  "chart_type": "line",
  "title": "Daily Revenue Trend — March 2026",
  "x_label": "Date",
  "y_label": "Revenue (USD)",
  "data": [
    {"date": "2026-03-01", "total_revenue": 2400},
    {"date": "2026-03-02", "total_revenue": 2210}
  ],
  "insights": "Revenue peaked on March 14 at $4,250 (+32% above average)...",
  "row_count": 30,
  "execution_ms": 142,
  "status": "success"
}
```

### 2. Query History
```
GET /api/manager/analytics/history?session_id=<optional_uuid>&limit=20
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "queries": [
    {
      "id": 42,
      "natural_language_query": "What is the trend of our profit this month?",
      "chart_type": "line",
      "insights": "Revenue peaked on March 14...",
      "row_count": 30,
      "execution_ms": 142,
      "created_at": "2026-03-25T14:30:45.123456"
    }
  ],
  "count": 1
}
```

## 🎨 Chart Type Reference

| Keyword Pattern | Chart Type | Example |
|---|---|---|
| trend, over time, growth, progression | LINE | "Show me the revenue trend" |
| compare, vs, breakdown, distribution | BAR | "Compare bookings by wing" |
| share, percent, proportion, split | PIE | "Show room type breakdown %" |
| list, table, detailed | TABLE | "List all guests with total stays" |

## 📊 Available Data for Analytics

### Revenue Queries
- Total revenue, daily/weekly/monthly
- Revenue by wing, room type, booking status
- Refund patterns and payment failures
- Revenue trends and forecasts

### Occupancy Queries
- Rooms occupied today/this week
- Occupancy rate by wing or room type
- Booking status distribution
- Cancellation patterns

### Guest Queries
- Total guest count, by loyalty tier
- Guest satisfaction ratings
- Booking frequency patterns
- Review sentiment analysis

### Booking Queries
- Total bookings by status
- Average booking value
- Booking source distribution
- Length of stay trends

## 🔑 Manager Permissions

Managers have a `permissions` JSONB field:

```python
{
  "view_guest_pii": False,  # If false, guest names/emails hidden
  "can_export": True,        # Can export query results
  "can_schedule": False,     # Can schedule automated reports
  "max_query_days": 90       # Max historical data range
}
```

**Permission-Based PII Stripping:**
- If `view_guest_pii: False`, queries automatically exclude: email, phone, nationality, ID numbers
- Guest names shown as "G..." for privacy

## 🧪 Testing the System

### Manual Test via cURL

```bash
# Set JWT token from login endpoint
TOKEN="your_jwt_token_here"

# Test trend query
curl -X POST "http://localhost:8000/api/manager/analytics/chat?message=Show%20the%20revenue%20trend%20this%20month" \
  -H "Authorization: Bearer $TOKEN"

# Test history
curl -X GET "http://localhost:8000/api/manager/analytics/history?limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

### Python Test

```python
import asyncio
import httpx

async def test_analytics():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/manager/analytics/chat",
            params={"message": "revenue trend this month"},
            headers={"Authorization": f"Bearer {token}"}
        )
        print(response.json())

asyncio.run(test_analytics())
```

## 📈 Example Queries

### Trend Analysis
- "What's the booking trend for the last month?"
- "Show revenue growth by week"
- "How is occupancy trending?"

### Comparative Analysis
- "Compare revenue between wings"
- "Which room types are booking best?"
- "Bookings by guest loyalty tier"

### Statistical Analysis
- "What's the average booking value?"
- "Guest satisfaction by room type"
- "Cancellation rate trend"

### Time-Series Analysis
- "Revenue by day for last 30 days"
- "Occupancy rate week-over-week"
- "Peak booking times"

## ⚙️ Database Tables

### manager_chat_sessions
```sql
SELECT * FROM manager_chat_sessions;
-- Columns: id, session_id (UUID), manager_id, started_at, ended_at, 
--          messages (JSONB), status
```

### manager_analytics_queries
```sql
SELECT * FROM manager_analytics_queries;
-- Columns: id, chat_session_id, manager_id, natural_language_query, 
--          generated_sql, chart_type, chart_config, result_data, 
--          insights, execution_ms, status, created_at
```

## 🐛 Troubleshooting

### Query Returns Empty Results
- Check date range is correct
- Verify data exists for the queried period
- Try a simpler query first

### Chart Type Incorrect
- Use explicit keywords: "trend", "compare", "share"
- Example: "Show the **trend** of..." will always produce line chart

### LLM Error (No SQL Generated)
- Check Groq API key is valid in .env
- Verify internet connection
- Try rephrasing the question

### Permission Denied
- Verify JWT token is valid
- Check manager.permissions settings
- Ensure view_guest_pii is set correctly

## 📝 Notes

- Queries are cached for 24 hours
- Maximum query execution time: 30 seconds
- Results limited to 10,000 rows for performance
- Charts display up to 365 data points
- Insights generated using LLM (may vary)

---
**Last Updated:** March 25, 2026
