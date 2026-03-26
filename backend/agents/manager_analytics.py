"""Manager Analytics Agent - Natural language SQL generation for managers."""
import json
import re
from agents.base import BaseAgent
from datetime import datetime, timedelta

SCHEMA_CONTEXT = """
## Database Schema Reference

### payment_history
- Columns: id, booking_id, guest_id, amount, currency, transaction_type, payment_method, gateway, status, processed_at
- transaction_type: 'charge', 'refund', 'partial_refund', 'authorization', 'capture'
- status: 'pending', 'completed', 'failed'

### bookings
- Columns: id, booking_ref, guest_id, room_id, check_in, check_out, num_guests, status, total_price, payment_status, created_at, booked_via
- status: 'confirmed', 'cancelled', 'completed'
- payment_status: 'paid', 'pending', 'refunded'

### rooms
- Columns: id, room_number, room_name, room_type_id, wing_id, floor, view_type, capacity, base_price, amenities, position_x, position_y

### room_types
- Columns: id, name, tier, base_price_min, base_price_max, max_occupancy, size_sqft

### wings
- Columns: id, name, description, floor_count

### guests
- Columns: id, first_name, last_name, email, phone, nationality, loyalty_tier, total_stays, created_at

### reviews
- Columns: id, booking_id, guest_id, room_id, rating, cleanliness, service, location, value, title, comment

### chat_sessions
- Columns: id, session_id, guest_id, started_at, ended_at, messages, agent_type

### booking_addons
- Columns: id, booking_id, addon_type, addon_name, price, quantity, scheduled_date, status

### analytics_events
- Columns: id, event_type, source, metadata, reference_type, reference_id, created_at

### managers
- Columns: id, name, email, role, permissions (JSONB with view_guest_pii flag)
"""

CHART_TYPE_RULES = """
## Chart Type Detection Rules

Detect chart type from keywords in the natural language query:
- LINE chart: Keywords like "trend", "over time", "progression", "growth", "decline", "timeline"
- BAR chart: Keywords like "compare", "vs", "breakdown", "distribution", "by wing", "by room", "by type"
- PIE chart: Keywords like "share", "percent", "proportion", "split", "breakdown %"
- TABLE: Default for analytics queries that don't fit above patterns

Return ONE of: "line", "bar", "pie", "table"
"""


class ManagerAnalyticsAgent(BaseAgent):
    """Agent for translating natural language analytics queries to SQL."""

    METRIC_ALIASES = {
        "profit": ["profit", "earnings", "net", "income"],
        "revenue": ["revenue", "sales", "turnover"],
        "bookings": ["booking", "bookings", "reservation", "reservations"],
        "occupancy": ["occupancy", "occupied", "fill rate"],
        "rating": ["rating", "ratings", "review score", "satisfaction"],
        "cancellation": ["cancel", "cancelled", "cancellation", "churn"],
    }

    DIMENSION_ALIASES = {
        "wing": ["wing", "wings"],
        "room_type": ["room type", "room types", "type", "tier"],
        "status": ["status", "states"],
        "date": ["day", "daily", "date", "time", "timeline", "trend"],
        "booked_via": ["channel", "source", "booked via", "booking channel"],
        "loyalty": ["loyalty", "tier", "membership"],
    }

    def __init__(self):
        system_prompt = f"""You are an expert AI analytics assistant for a luxury resort.
You help managers query the database in natural language.

{SCHEMA_CONTEXT}

{CHART_TYPE_RULES}

## Instructions

1. ALWAYS generate valid PostgreSQL queries
2. Validate date ranges (use CURRENT_DATE - INTERVAL for relative dates)
3. GROUP BY and ORDER BY for trending queries
4. Use SUM() for revenue, COUNT() for bookings, AVG() for ratings
5. Join tables carefully - never create cartesian products
6. Filter payment_history to only "completed" transactions for revenue
7. Restrict guest PII fields (email, phone, nationality) based on manager.permissions.view_guest_pii

## Response Format (MUST be valid JSON)

{{
    "sql": "SELECT ... FROM ... WHERE ...",
    "chart_type": "line|bar|pie|table",
    "title": "descriptive title for the chart",
    "x_axis": "label for x-axis",
    "y_axis": "label for y-axis",
    "x_label": "unit/dimension (e.g., Date, Room Type, Wing)",
    "y_label": "unit/value (e.g., Revenue USD, Count, Percentage)"
}}

Keep SQL efficient. Return results within 30 seconds."""

        tools = [
            {
                "type": "function",
                "function": {
                    "name": "analyze_query",
                    "description": "Analyze natural language query and return SQL + chart config",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "The natural language user query"
                            }
                        },
                        "required": ["query"]
                    }
                }
            }
        ]

        super().__init__(
            name="ManagerAnalyticsAgent",
            system_prompt=system_prompt,
            tools=tools
        )

    def _fallback_analysis(self, natural_language: str) -> dict:
        """Rule-based fallback when LLM response is missing/invalid."""
        q = self._normalize_query(natural_language)

        if ("trend" in q or "over time" in q) and ("profit" in q or "revenue" in q) and "month" in q:
            return {
                "sql": (
                    "SELECT DATE(booked_at) AS day, "
                    "SUM(total_price) AS profit "
                    "FROM bookings "
                    "WHERE status IN ('confirmed','completed') "
                    "AND booked_at >= DATE_TRUNC('month', CURRENT_DATE) "
                    "AND booked_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' "
                    "GROUP BY DATE(booked_at) "
                    "ORDER BY day"
                ),
                "chart_type": "line",
                "title": "Profit Trend This Month",
                "x_axis": "day",
                "y_axis": "profit",
                "x_label": "Date",
                "y_label": "Profit"
            }

        if ("compare" in q or "breakdown" in q or "by wing" in q) and ("revenue" in q or "profit" in q):
            return {
                "sql": (
                    "SELECT w.name AS wing, "
                    "SUM(b.total_price) AS profit "
                    "FROM bookings b "
                    "JOIN rooms r ON r.id = b.room_id "
                    "JOIN wings w ON w.id = r.wing_id "
                    "WHERE b.status IN ('confirmed','completed') "
                    "GROUP BY w.name "
                    "ORDER BY profit DESC"
                ),
                "chart_type": "bar",
                "title": "Profit by Wing",
                "x_axis": "wing",
                "y_axis": "profit",
                "x_label": "Wing",
                "y_label": "Profit"
            }

        return {
            "sql": "SELECT status, COUNT(*) AS count FROM bookings GROUP BY status ORDER BY count DESC",
            "chart_type": "table",
            "title": "Booking Status Summary",
            "x_axis": "status",
            "y_axis": "count",
            "x_label": "Status",
            "y_label": "Count"
        }

    def _normalize_query(self, query_text: str) -> str:
        """Normalize query phrasing and common typos to improve intent detection."""
        q = query_text.lower().strip()
        typo_map = {
            "qusetion": "question",
            "quetrion": "question",
            "revnue": "revenue",
            "proft": "profit",
            "occpancy": "occupancy",
            "canelled": "cancelled",
        }
        for bad, good in typo_map.items():
            q = q.replace(bad, good)
        return q

    def _pick_alias(self, query_text: str, alias_map: dict[str, list[str]], default: str = "") -> str:
        for canonical, terms in alias_map.items():
            if any(term in query_text for term in terms):
                return canonical
        return default

    def _extract_intent(self, query_text: str) -> dict:
        """Extract lightweight semantic intent from natural language."""
        q = self._normalize_query(query_text)
        return {
            "metric": self._pick_alias(q, self.METRIC_ALIASES, "bookings"),
            "dimension": self._pick_alias(q, self.DIMENSION_ALIASES, "status"),
            "is_trend": any(t in q for t in ["trend", "over time", "daily", "weekly", "monthly", "timeline"]),
            "is_share": any(t in q for t in ["share", "percent", "%", "proportion", "split"]),
            "is_compare": any(t in q for t in ["compare", "vs", "breakdown", "by"]),
            "time_scope": "month" if "month" in q else ("quarter" if "quarter" in q else "all"),
        }

    def _template_analysis(self, query_text: str, intent: dict) -> dict | None:
        """Deterministic SQL templates for most frequent manager questions."""
        metric = intent.get("metric")
        dimension = intent.get("dimension")
        is_trend = intent.get("is_trend")
        is_share = intent.get("is_share")

        if metric in {"profit", "revenue"} and is_trend:
            return {
                "sql": (
                    "SELECT DATE(booked_at) AS day, SUM(total_price) AS value "
                    "FROM bookings "
                    "WHERE status IN ('confirmed','completed') "
                    "AND booked_at >= DATE_TRUNC('month', CURRENT_DATE) "
                    "AND booked_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' "
                    "GROUP BY DATE(booked_at) ORDER BY day"
                ),
                "chart_type": "line",
                "title": "Revenue Trend This Month",
                "x_axis": "day",
                "y_axis": "value",
                "x_label": "Date",
                "y_label": "Revenue",
            }

        if metric in {"profit", "revenue"} and dimension == "wing":
            return {
                "sql": (
                    "SELECT w.name AS wing, SUM(b.total_price) AS value "
                    "FROM bookings b "
                    "JOIN rooms r ON r.id = b.room_id "
                    "JOIN wings w ON w.id = r.wing_id "
                    "WHERE b.status IN ('confirmed','completed') "
                    "GROUP BY w.name ORDER BY value DESC"
                ),
                "chart_type": "bar",
                "title": "Revenue by Wing",
                "x_axis": "wing",
                "y_axis": "value",
                "x_label": "Wing",
                "y_label": "Revenue",
            }

        if metric == "bookings" and (dimension == "status" or is_share):
            return {
                "sql": (
                    "SELECT status, COUNT(*) AS value "
                    "FROM bookings GROUP BY status ORDER BY value DESC"
                ),
                "chart_type": "pie" if is_share else "table",
                "title": "Bookings by Status",
                "x_axis": "status",
                "y_axis": "value",
                "x_label": "Status",
                "y_label": "Bookings",
            }

        if metric == "bookings" and dimension == "room_type":
            return {
                "sql": (
                    "SELECT rt.name AS room_type, COUNT(*) AS value "
                    "FROM bookings b "
                    "JOIN rooms r ON r.id = b.room_id "
                    "JOIN room_types rt ON rt.id = r.room_type_id "
                    "GROUP BY rt.name ORDER BY value DESC"
                ),
                "chart_type": "bar",
                "title": "Bookings by Room Type",
                "x_axis": "room_type",
                "y_axis": "value",
                "x_label": "Room Type",
                "y_label": "Bookings",
            }

        if metric == "rating" and dimension == "wing":
            return {
                "sql": (
                    "SELECT w.name AS wing, AVG(rv.overall_rating) AS value "
                    "FROM reviews rv "
                    "JOIN rooms r ON r.id = rv.room_id "
                    "JOIN wings w ON w.id = r.wing_id "
                    "GROUP BY w.name ORDER BY value DESC"
                ),
                "chart_type": "bar",
                "title": "Average Rating by Wing",
                "x_axis": "wing",
                "y_axis": "value",
                "x_label": "Wing",
                "y_label": "Average Rating",
            }

        return None

    def _repair_sql(self, sql: str) -> str:
        """Repair SQL against known local schema differences."""
        if not sql:
            return sql
        repaired = sql
        # Local DB in this workspace does not have payment_history table.
        if "payment_history" in repaired.lower():
            repaired = repaired.replace("payment_history", "bookings")
        return repaired

    def _detect_chart_type(self, query_text: str) -> str:
        """Detect chart type from keywords in query."""
        query_lower = query_text.lower()
        
        # LINE chart patterns
        if any(word in query_lower for word in ["trend", "over time", "progression", "growth", 
                                                  "decline", "timeline", "daily", "weekly", 
                                                  "monthly", "yearly", "increase", "decrease"]):
            return "line"
        
        # PIE chart patterns
        if any(word in query_lower for word in ["share", "percent", "proportion", "split", 
                                                  "breakdown %", "composition"]):
            return "pie"
        
        # BAR chart patterns
        if any(word in query_lower for word in ["compare", "vs", "breakdown", "distribution", 
                                                  "by wing", "by room", "by type", "by floor",
                                                  "average", "total by", "each"]):
            return "bar"
        
        # Default to table
        return "table"

    def _extract_date_range(self, query_text: str) -> tuple:
        """Extract date range from query text."""
        query_lower = query_text.lower()
        today = datetime.now().date()
        
        # Last month
        if "last month" in query_lower or "this month" in query_lower:
            start = (today.replace(day=1) - timedelta(days=1)).replace(day=1)
            end = today.replace(day=1) - timedelta(days=1)
            return (start, end)
        
        # Last week
        if "last week" in query_lower or "this week" in query_lower:
            start = today - timedelta(days=7)
            return (start, today)
        
        # Last 30 days
        if "30 days" in query_lower or "30 day" in query_lower:
            return (today - timedelta(days=30), today)
        
        # Last 90 days
        if "90 days" in query_lower or "90 day" in query_lower or "quarter" in query_lower:
            return (today - timedelta(days=90), today)
        
        # Last year / YTD
        if "last year" in query_lower or "year" in query_lower:
            return (today - timedelta(days=365), today)
        
        # Default to last 30 days
        return (today - timedelta(days=30), today)

    async def query(self, natural_language: str, manager_permissions: dict = None) -> dict:
        """
        Translate natural language query to SQL + chart config.
        
        Args:
            natural_language: User's natural language question
            manager_permissions: Manager's permissions dict (e.g., {"view_guest_pii": False})
        
        Returns:
            {
                "sql": "SELECT ...",
                "chart_type": "line|bar|pie|table",
                "title": "...",
                "x_axis": "...",
                "y_axis": "...",
                "x_label": "...",
                "y_label": "..."
            }
        """
        if not manager_permissions:
            manager_permissions = {"view_guest_pii": False}

        normalized_query = self._normalize_query(natural_language)
        intent = self._extract_intent(normalized_query)

        templated = self._template_analysis(normalized_query, intent)
        if templated:
            return templated
        
        # Add permission context to query
        permission_note = f"\n\nManager permissions: view_guest_pii={manager_permissions.get('view_guest_pii', False)}"
        enhanced_query = f"{normalized_query}{permission_note}"
        
        messages = [{"role": "user", "content": enhanced_query}]
        
        response = await self.chat(messages)
        
        # Parse response
        if response.tool_calls:
            # Tool was called - extract the SQL from the function arguments
            tool_call = response.tool_calls[0]
            analysis = json.loads(tool_call.function.arguments)
        else:
            # Parse from content
            content = response.content or ""
            try:
                analysis = json.loads(content)
            except json.JSONDecodeError:
                # Fallback: try to extract JSON from content
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    analysis = json.loads(json_match.group())
                else:
                    analysis = {
                        "sql": "",
                        "chart_type": "table",
                        "title": "Query Result",
                        "x_axis": "",
                        "y_axis": "",
                        "x_label": "",
                        "y_label": ""
                    }
        
        analysis["sql"] = self._repair_sql(analysis.get("sql") or "")
        if not analysis.get("chart_type"):
            analysis["chart_type"] = self._detect_chart_type(normalized_query)

        sql_text = (analysis.get("sql") or "").lower()
        if (not analysis.get("sql")) or ("payment_history" in sql_text):
            return self._fallback_analysis(natural_language)

        return analysis

    def infer_chart_type_from_data(self, query_text: str, data: list[dict], proposed: str = "table") -> str:
        """Infer best chart type from returned data shape, not just query keywords."""
        if not data:
            return "table"

        q = self._normalize_query(query_text)
        row0 = data[0]
        keys = list(row0.keys())
        if len(keys) < 2:
            return "table"

        def is_numeric(v):
            return isinstance(v, (int, float)) and not isinstance(v, bool)

        numeric_cols = [k for k in keys if is_numeric(row0.get(k))]
        category_cols = [k for k in keys if k not in numeric_cols]

        if any(token in q for token in ["share", "percent", "proportion", "%"]):
            if len(category_cols) >= 1 and len(data) <= 8 and numeric_cols:
                return "pie"

        if category_cols and numeric_cols:
            first_cat = category_cols[0]
            looks_time = any(t in first_cat.lower() for t in ["date", "day", "week", "month", "year", "time"])
            if looks_time and len(numeric_cols) == 1:
                return "line"
            if len(data) <= 20:
                return "bar"

        return proposed or "table"

    async def execute_and_capture(self, db_session, sql: str, chart_type: str) -> dict:
        """
        Execute SQL query and capture results.
        
        Args:
            db_session: SQLAlchemy async session
            sql: SQL query to execute
            chart_type: Type of chart (for data formatting)
        
        Returns:
            {
                "success": bool,
                "data": [...],  # rows as list of dicts
                "row_count": int,
                "execution_ms": int,
                "error": str (if failed)
            }
        """
        import time
        from sqlalchemy import text
        
        start_time = time.time()
        
        try:
            result = await db_session.execute(text(sql))
            rows = result.fetchall()
            
            # Convert rows to list of dicts
            data = [dict(row._mapping) for row in rows]
            
            # Convert decimal/datetime to JSON-serializable types
            for row in data:
                for key, value in row.items():
                    if hasattr(value, 'isoformat'):
                        row[key] = value.isoformat()
                    elif hasattr(value, '__float__'):
                        row[key] = float(value)
            
            execution_ms = int((time.time() - start_time) * 1000)
            
            return {
                "success": True,
                "data": data,
                "row_count": len(data),
                "execution_ms": execution_ms,
                "error": None
            }
        
        except Exception as e:
            execution_ms = int((time.time() - start_time) * 1000)
            return {
                "success": False,
                "data": [],
                "row_count": 0,
                "execution_ms": execution_ms,
                "error": str(e)
            }

    async def generate_insights(self, data: list, query_text: str, chart_type: str) -> str:
        """
        Generate AI insights from query results.
        
        Args:
            data: Query result rows (list of dicts)
            query_text: Original natural language query
            chart_type: Chart type
        
        Returns:
            AI-generated insight text (2-3 sentences)
        """
        if not data:
            return "No data available for this time period."
        
        # Create a summary message for the LLM
        data_summary = json.dumps(data[:10], default=str)  # First 10 rows
        summary_query = f"""Based on this data from a luxury resort analytics query:

Question: {query_text}
Data: {data_summary}
Total rows: {len(data)}

Generate 2-3 sentences of business insights (no markdown, plain text only)."""
        
        messages = [{"role": "user", "content": summary_query}]
        
        response = await self.chat(messages)
        insights = response.content or "Data processed successfully."
        
        return insights.strip()
