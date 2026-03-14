"""Manager router — analytics dashboard, guest management, AI analytics."""
from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_db
from db.models import Manager, Booking, Guest, Room, RoomType, Review, AnalyticsEvent
from db import queries
from routers.auth import get_current_manager
from agents.analytics import AnalyticsAgent

router = APIRouter(prefix="/api/manager", tags=["manager"])

analytics_agent = AnalyticsAgent()


@router.get("/dashboard")
async def dashboard(
    manager: Manager = Depends(get_current_manager),
    db: AsyncSession = Depends(get_db),
):
    """Main dashboard data — key metrics for today."""
    today = date.today()
    summary = await queries.get_analytics_summary(db)

    # Total guests
    total_guests_r = await db.execute(select(func.count(Guest.id)))
    total_guests = total_guests_r.scalar() or 0

    # Total bookings
    total_bookings_r = await db.execute(select(func.count(Booking.id)))
    total_bookings = total_bookings_r.scalar() or 0

    # Bookings by status
    status_q = await db.execute(
        select(Booking.status, func.count(Booking.id)).group_by(Booking.status)
    )
    bookings_by_status = {r[0]: r[1] for r in status_q.all()}

    # Recent bookings (last 20)
    recent_q = await db.execute(
        select(
            Booking.booking_ref,
            Booking.check_in,
            Booking.check_out,
            Booking.total_price,
            Booking.status,
            Booking.num_guests,
            Booking.booked_at,
            (Guest.first_name + " " + Guest.last_name).label("guest_name"),
            Guest.email.label("guest_email"),
            Room.room_number,
            Room.room_name,
            RoomType.name.label("room_type"),
        )
        .join(Guest, Booking.guest_id == Guest.id)
        .join(Room, Booking.room_id == Room.id)
        .join(RoomType, Room.room_type_id == RoomType.id)
        .order_by(Booking.booked_at.desc())
        .limit(20)
    )
    recent_bookings = [dict(r._mapping) for r in recent_q.all()]

    # Top wings by bookings
    from db.models import Wing
    wing_q = await db.execute(
        select(Wing.name, func.count(Booking.id).label("bookings"))
        .join(Room, Room.wing_id == Wing.id)
        .join(Booking, Booking.room_id == Room.id)
        .where(Booking.status != "cancelled")
        .group_by(Wing.name)
        .order_by(func.count(Booking.id).desc())
    )
    top_wings = [{"wing": r[0], "bookings": r[1]} for r in wing_q.all()]

    # Revenue by month (last 6 months)
    revenue_monthly = summary.get("monthly", [])

    return {
        "manager": manager.name,
        "role": manager.role,
        "date": str(today),
        "total_rooms": summary.get("total_rooms", 0),
        "occupied_rooms": summary.get("occupied_today", 0),
        "occupancy_rate": summary.get("occupancy_rate", 0),
        "avg_rating": summary.get("avg_rating", 0),
        "total_revenue": summary.get("total_revenue", 0),
        "total_guests": total_guests,
        "total_bookings": total_bookings,
        "bookings_by_status": bookings_by_status,
        "top_wings": top_wings,
        "top_rooms": summary.get("top_rooms", []),
        "recent_bookings": recent_bookings,
        "revenue_monthly": revenue_monthly,
        "by_wing": summary.get("by_wing", []),
    }


@router.get("/bookings")
async def manager_bookings(
    status: str | None = None,
    from_date: date | None = None,
    to_date: date | None = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    manager: Manager = Depends(get_current_manager),
    db: AsyncSession = Depends(get_db),
):
    """List bookings with filters for manager view."""
    query = (
        select(
            Booking.id,
            Booking.booking_ref,
            Booking.check_in,
            Booking.check_out,
            Booking.total_price,
            Booking.status,
            Booking.num_guests,
            (Guest.first_name + ' ' + Guest.last_name).label("guest_name"),
            Guest.email.label("guest_email"),
            Room.room_number,
            RoomType.name.label("room_type"),
        )
        .join(Guest, Booking.guest_id == Guest.id)
        .join(Room, Booking.room_id == Room.id)
        .join(RoomType, Room.room_type_id == RoomType.id)
    )
    if status:
        query = query.where(Booking.status == status)
    if from_date:
        query = query.where(Booking.check_in >= from_date)
    if to_date:
        query = query.where(Booking.check_out <= to_date)

    query = query.order_by(Booking.check_in.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    rows = result.mappings().all()
    return {"bookings": [dict(r) for r in rows], "count": len(rows)}


@router.get("/guests")
async def manager_guests(
    search: str | None = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    manager: Manager = Depends(get_current_manager),
    db: AsyncSession = Depends(get_db),
):
    """List guests — searchable by name or email."""
    query = select(Guest)
    if search:
        pattern = f"%{search}%"
        query = query.where(
            (Guest.first_name + ' ' + Guest.last_name).ilike(pattern) | Guest.email.ilike(pattern)
        )
    query = query.order_by(Guest.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    guests = result.scalars().all()
    return {
        "guests": [
            {
                "id": g.id,
                "name": f"{g.first_name} {g.last_name}",
                "email": g.email,
                "phone": g.phone,
                "nationality": g.nationality,
                "loyalty_tier": g.loyalty_tier,
                "total_stays": g.total_stays,
                "created_at": str(g.created_at),
            }
            for g in guests
        ],
        "count": len(guests),
    }


@router.get("/reviews")
async def manager_reviews(
    min_rating: int | None = None,
    limit: int = Query(50, le=200),
    manager: Manager = Depends(get_current_manager),
    db: AsyncSession = Depends(get_db),
):
    """List guest reviews."""
    query = (
        select(
            Review.id,
            Review.overall_rating,
            Review.title,
            Review.comment,
            Review.created_at,
            (Guest.first_name + ' ' + Guest.last_name).label("guest_name"),
            Room.room_number,
        )
        .join(Guest, Review.guest_id == Guest.id)
        .join(Room, Review.room_id == Room.id)
    )
    if min_rating:
        query = query.where(Review.overall_rating >= min_rating)
    query = query.order_by(Review.created_at.desc()).limit(limit)
    result = await db.execute(query)
    rows = result.mappings().all()
    return {"reviews": [dict(r) for r in rows], "count": len(rows)}


@router.post("/ai-insights")
async def ai_insights(
    question: str | None = "Give me a full analytics overview",
    manager: Manager = Depends(get_current_manager),
    db: AsyncSession = Depends(get_db),
):
    """Ask the AI Analytics Agent a question about resort performance."""
    messages = [{"role": "user", "content": question}]
    result = await analytics_agent.process(messages, db)
    return {"insight": result["content"], "manager": manager.name}
