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
    return {
        "manager": manager.name,
        "role": manager.role,
        "date": str(today),
        **summary,
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
