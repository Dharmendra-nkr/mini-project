"""Benchmark manager analytics agent quality before/after improvements.

Metrics:
- SQL success rate
- Chart type accuracy (against expected chart labels)
- Non-empty result rate
- Average execution latency
"""

import asyncio
import json
import statistics
import time
from dataclasses import dataclass
from pathlib import Path

from agents.manager_analytics import ManagerAnalyticsAgent
from db.session import async_session


@dataclass
class EvalCase:
    query: str
    expected_chart: str


EVAL_CASES: list[EvalCase] = [
    EvalCase("What is the trend of our profit this month?", "line"),
    EvalCase("Show revenue over time for the last 30 days", "line"),
    EvalCase("Compare revenue by wing", "bar"),
    EvalCase("Breakdown of bookings by room type", "bar"),
    EvalCase("Occupancy trend for this month", "line"),
    EvalCase("What percent of bookings come from each wing?", "pie"),
    EvalCase("Share of bookings by status", "pie"),
    EvalCase("Average rating by wing", "bar"),
    EvalCase("Show top room types by revenue", "bar"),
    EvalCase("How many bookings were cancelled this quarter?", "table"),
    EvalCase("Daily booking count this month", "line"),
    EvalCase("Which wing performs best in profit?", "bar"),
    EvalCase("Revenue split by booking channel", "pie"),
    EvalCase("List booking status summary", "table"),
    EvalCase("Compare occupancy across wings", "bar"),
    EvalCase("Give me monthly revenue progression", "line"),
    EvalCase("Distribution of guest loyalty tiers", "bar"),
    EvalCase("Top 10 rooms by booking count", "bar"),
    EvalCase("How is revenue changing week over week?", "line"),
    EvalCase("Show me a table of confirmed vs cancelled bookings", "table"),
]


async def run_benchmark() -> dict:
    agent = ManagerAnalyticsAgent()
    details: list[dict] = []

    sql_success = 0
    chart_hits = 0
    non_empty_hits = 0
    latencies_ms: list[int] = []

    async with async_session() as db:
        for case in EVAL_CASES:
            started = time.perf_counter()
            error = None
            try:
                analysis = await agent.query(case.query, {"view_guest_pii": False})
                chart_type = (analysis.get("chart_type") or "table").lower()
                sql = analysis.get("sql") or ""

                exec_result = await agent.execute_and_capture(db, sql, chart_type)

                is_success = bool(exec_result.get("success"))
                row_count = int(exec_result.get("row_count") or 0)
                latency = int(exec_result.get("execution_ms") or 0)
                if latency <= 0:
                    latency = int((time.perf_counter() - started) * 1000)

                sql_success += 1 if is_success else 0
                chart_hits += 1 if chart_type == case.expected_chart else 0
                non_empty_hits += 1 if row_count > 0 else 0
                latencies_ms.append(latency)

                details.append(
                    {
                        "query": case.query,
                        "expected_chart": case.expected_chart,
                        "predicted_chart": chart_type,
                        "sql_success": is_success,
                        "row_count": row_count,
                        "latency_ms": latency,
                    }
                )
            except Exception as exc:
                error = str(exc)
                details.append(
                    {
                        "query": case.query,
                        "expected_chart": case.expected_chart,
                        "predicted_chart": None,
                        "sql_success": False,
                        "row_count": 0,
                        "latency_ms": int((time.perf_counter() - started) * 1000),
                        "error": error,
                    }
                )

    total = len(EVAL_CASES)
    result = {
        "total_cases": total,
        "sql_success_rate": round((sql_success / total) * 100, 2),
        "chart_accuracy": round((chart_hits / total) * 100, 2),
        "non_empty_result_rate": round((non_empty_hits / total) * 100, 2),
        "avg_latency_ms": round(statistics.mean(latencies_ms), 2) if latencies_ms else 0,
        "p95_latency_ms": round(statistics.quantiles(latencies_ms, n=20)[-1], 2)
        if len(latencies_ms) >= 2
        else (latencies_ms[0] if latencies_ms else 0),
        "details": details,
    }
    return result


def main() -> None:
    out = asyncio.run(run_benchmark())
    ts = time.strftime("%Y%m%d_%H%M%S")
    reports_dir = Path(__file__).resolve().parent / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)
    target = reports_dir / f"manager_analytics_benchmark_{ts}.json"
    target.write_text(json.dumps(out, indent=2), encoding="utf-8")
    print(json.dumps({k: v for k, v in out.items() if k != "details"}, indent=2))
    print(f"saved_report={target}")


if __name__ == "__main__":
    main()
