"""Reusable database queries for rooms, bookings, guests."""
from datetime import date
from typing import Optional
from sqlalchemy import select, func, and_, or_, not_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from db.models import Room, Booking, Guest, Wing, RoomType, Review, BookingAddon
import random
import string


async def get_rooms(
    db: AsyncSession,
    wing: Optional[str] = None,
    floor: Optional[int] = None,
    view_type: Optional[str] = None,
    room_type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    capacity: Optional[int] = None,
) -> list[Room]:
    query = (
        select(Room)
        .join(Wing)
        .join(RoomType)
        .options(selectinload(Room.wing), selectinload(Room.room_type), selectinload(Room.reviews))
        .where(Room.is_active == True)
    )
    if wing:
        query = query.where(Wing.name.ilike(f"%{wing}%"))
    if floor:
        query = query.where(Room.floor == floor)
    if view_type:
        query = query.where(Room.view_type == view_type)
    if room_type:
        query = query.where(RoomType.name.ilike(f"%{room_type}%"))
    if min_price is not None:
        query = query.where(Room.base_price >= min_price)
    if max_price is not None:
        query = query.where(Room.base_price <= max_price)
    if capacity:
        query = query.where(Room.capacity >= capacity)
    query = query.order_by(Room.base_price)
    result = await db.execute(query)
    return result.scalars().all()


async def get_room_by_id(db: AsyncSession, room_id: int) -> Optional[Room]:
    query = (
        select(Room)
        .options(selectinload(Room.wing), selectinload(Room.room_type), selectinload(Room.reviews))
        .where(Room.id == room_id)
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def get_available_rooms(
    db: AsyncSession, check_in: date, check_out: date,
    wing: Optional[str] = None, view_type: Optional[str] = None,
    min_price: Optional[float] = None, max_price: Optional[float] = None,
    capacity: Optional[int] = None,
) -> list[Room]:
    """Get rooms that are NOT booked for the given date range."""
    booked_subq = (
        select(Booking.room_id)
        .where(
            Booking.status.in_(["confirmed", "checked_in", "pending"]),
            Booking.check_in < check_out,
            Booking.check_out > check_in,
        )
        .subquery()
    )
    query = (
        select(Room).join(Wing).join(RoomType)
        .where(Room.is_active == True, Room.id.not_in(select(booked_subq.c.room_id)))
    )
    if wing:
        query = query.where(Wing.name.ilike(f"%{wing}%"))
    if view_type:
        query = query.where(Room.view_type == view_type)
    if min_price is not None:
        query = query.where(Room.base_price >= min_price)
    if max_price is not None:
        query = query.where(Room.base_price <= max_price)
    if capacity:
        query = query.where(Room.capacity >= capacity)
    query = query.order_by(Room.base_price)
    result = await db.execute(query)
    return result.scalars().all()


async def get_availability_map(db: AsyncSession, target_date: date) -> list[dict]:
    """Return all rooms with their availability status for the 3D map."""
    booked_subq = (
        select(Booking.room_id)
        .where(
            Booking.status.in_(["confirmed", "checked_in"]),
            Booking.check_in <= target_date,
            Booking.check_out > target_date,
        )
        .subquery()
    )
    query = (
        select(
            Room.id, Room.room_number, Room.room_name, Room.mesh_id,
            Room.floor, Room.position_x, Room.position_y, Room.position_z,
            Room.base_price, Room.view_type, Room.capacity,
            Wing.name.label("wing_name"),
            RoomType.name.label("type_name"),
            RoomType.tier,
        )
        .join(Wing).join(RoomType)
        .where(Room.is_active == True)
    )
    result = await db.execute(query)
    rows = result.all()

    # Get booked room IDs
    booked_result = await db.execute(
        select(Booking.room_id).where(
            Booking.status.in_(["confirmed", "checked_in"]),
            Booking.check_in <= target_date,
            Booking.check_out > target_date,
        )
    )
    booked_ids = {r[0] for r in booked_result.all()}

    return [
        {
            "id": r.id, "room_number": r.room_number, "room_name": r.room_name,
            "mesh_id": r.mesh_id, "floor": r.floor,
            "position": {"x": r.position_x, "y": r.position_y, "z": r.position_z},
            "base_price": float(r.base_price), "view_type": r.view_type,
            "capacity": r.capacity, "wing": r.wing_name,
            "type": r.type_name, "tier": r.tier,
            "available": r.id not in booked_ids,
        }
        for r in rows
    ]


def _gen_booking_ref() -> str:
    return "GM" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))


async def create_booking(
    db: AsyncSession,
    guest_id: int, room_id: int,
    check_in: date, check_out: date,
    num_guests: int = 1,
    special_requests: Optional[str] = None,
) -> Booking:
    """Create a new booking after checking availability."""
    # Verify room is available
    booked = await db.execute(
        select(Booking.id).where(
            Booking.room_id == room_id,
            Booking.status.in_(["confirmed", "checked_in", "pending"]),
            Booking.check_in < check_out,
            Booking.check_out > check_in,
        )
    )
    if booked.first():
        raise ValueError("Room not available for these dates. Please choose different dates or room.")

    room = await db.execute(select(Room).where(Room.id == room_id))
    room = room.scalar_one()
    nights = (check_out - check_in).days
    total_price = float(room.base_price) * nights

    booking = Booking(
        booking_ref=_gen_booking_ref(),
        guest_id=guest_id, room_id=room_id,
        check_in=check_in, check_out=check_out,
        num_guests=num_guests, status="confirmed",
        total_price=total_price,
        special_requests=special_requests,
        payment_status="paid", booked_via="website",
    )
    db.add(booking)
    await db.commit()
    await db.refresh(booking)
    return booking


async def cancel_booking(db: AsyncSession, booking_ref: str) -> Booking:
    result = await db.execute(
        select(Booking).where(Booking.booking_ref == booking_ref)
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise ValueError(f"Booking reference '{booking_ref}' not found.")
    if booking.status in ("cancelled", "checked_out"):
        raise ValueError(f"Booking is already {booking.status}.")
    booking.status = "cancelled"
    booking.payment_status = "refunded"
    from datetime import datetime
    booking.cancelled_at = datetime.utcnow()
    await db.commit()
    await db.refresh(booking)
    return booking


async def get_booking_by_ref(db: AsyncSession, booking_ref: str) -> Optional[Booking]:
    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.room), selectinload(Booking.guest), selectinload(Booking.addons))
        .where(Booking.booking_ref == booking_ref)
    )
    return result.scalar_one_or_none()


async def get_or_create_guest(
    db: AsyncSession, first_name: str, last_name: str, email: str, phone: str = ""
) -> Guest:
    result = await db.execute(select(Guest).where(Guest.email == email))
    guest = result.scalar_one_or_none()
    if guest:
        return guest
    guest = Guest(first_name=first_name, last_name=last_name, email=email, phone=phone)
    db.add(guest)
    await db.commit()
    await db.refresh(guest)
    return guest


async def get_analytics_summary(db: AsyncSession) -> dict:
    """Manager analytics: occupancy, revenue, ratings."""
    from datetime import datetime
    today = date.today()

    # Total revenue
    rev = await db.execute(
        select(func.sum(Booking.total_price)).where(Booking.status != "cancelled")
    )
    total_revenue = float(rev.scalar() or 0)

    # Active bookings today
    active = await db.execute(
        select(func.count(Booking.id)).where(
            Booking.status.in_(["confirmed", "checked_in"]),
            Booking.check_in <= today, Booking.check_out > today
        )
    )
    occupied_today = active.scalar()

    # Total rooms
    total_rooms_r = await db.execute(select(func.count(Room.id)).where(Room.is_active == True))
    total_rooms = total_rooms_r.scalar()

    # Avg rating
    avg_r = await db.execute(select(func.avg(Review.overall_rating)))
    avg_rating = round(float(avg_r.scalar() or 0), 2)

    # Revenue by month
    monthly = await db.execute(
        select(
            func.date_trunc("month", Booking.check_in).label("month"),
            func.sum(Booking.total_price).label("revenue"),
            func.count(Booking.id).label("bookings"),
        )
        .where(Booking.status != "cancelled")
        .group_by("month").order_by("month")
    )
    monthly_data = [
        {"month": str(r.month.date()), "revenue": float(r.revenue), "bookings": r.bookings}
        for r in monthly.all()
    ]

    # Revenue by wing
    wing_rev = await db.execute(
        select(
            Wing.name,
            func.sum(Booking.total_price).label("revenue"),
            func.count(Booking.id).label("bookings"),
        )
        .join(Room, Booking.room_id == Room.id)
        .join(Wing, Room.wing_id == Wing.id)
        .where(Booking.status != "cancelled")
        .group_by(Wing.name)
    )
    wing_data = [
        {"wing": r.name, "revenue": float(r.revenue), "bookings": r.bookings}
        for r in wing_rev.all()
    ]

    # Top rooms by bookings
    top_rooms = await db.execute(
        select(
            Room.room_name, Room.room_number, Wing.name.label("wing"),
            func.count(Booking.id).label("bookings"),
            func.avg(Review.overall_rating).label("avg_rating"),
        )
        .join(Room, Booking.room_id == Room.id)
        .join(Wing, Room.wing_id == Wing.id)
        .outerjoin(Review, Booking.id == Review.booking_id)
        .where(Booking.status != "cancelled")
        .group_by(Room.room_name, Room.room_number, Wing.name)
        .order_by(func.count(Booking.id).desc())
        .limit(10)
    )
    top_rooms_data = [
        {"room_name": r.room_name, "room_number": r.room_number, "wing": r.wing,
         "bookings": r.bookings, "avg_rating": round(float(r.avg_rating or 0), 2)}
        for r in top_rooms.all()
    ]

    return {
        "total_revenue": total_revenue,
        "occupied_today": occupied_today,
        "total_rooms": total_rooms,
        "occupancy_rate": round(occupied_today / total_rooms * 100, 1) if total_rooms else 0,
        "avg_rating": avg_rating,
        "monthly": monthly_data,
        "by_wing": wing_data,
        "top_rooms": top_rooms_data,
    }
