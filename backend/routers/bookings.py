"""Bookings router — create, lookup, cancel bookings."""
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.session import get_db
from backend.db import queries

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


class BookingCreate(BaseModel):
    room_id: int
    check_in: date
    check_out: date
    guest_first_name: str
    guest_last_name: str
    guest_email: EmailStr
    guest_phone: str | None = None
    num_guests: int = 1
    special_requests: str | None = None


class BookingLookup(BaseModel):
    booking_ref: str


@router.post("/")
async def create_booking(data: BookingCreate, db: AsyncSession = Depends(get_db)):
    """Create a new booking."""
    guest = await queries.get_or_create_guest(
        db,
        first_name=data.guest_first_name,
        last_name=data.guest_last_name,
        email=data.guest_email,
        phone=data.guest_phone or "",
    )

    try:
        booking = await queries.create_booking(
            db,
            guest_id=guest.id,
            room_id=data.room_id,
            check_in=data.check_in,
            check_out=data.check_out,
            num_guests=data.num_guests,
            special_requests=data.special_requests,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "booking_ref": booking.booking_ref,
        "total_price": float(booking.total_price),
        "check_in": str(booking.check_in),
        "check_out": str(booking.check_out),
        "status": booking.status,
    }


@router.get("/{booking_ref}")
async def lookup_booking(booking_ref: str, db: AsyncSession = Depends(get_db)):
    """Look up a booking by reference number."""
    booking = await queries.get_booking_by_ref(db, booking_ref)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    guest_name = f"{booking.guest.first_name} {booking.guest.last_name}".strip() if booking.guest else ""
    room_name = booking.room.room_name if booking.room else ""
    room_number = booking.room.room_number if booking.room else ""
    return {
        "booking_ref": booking.booking_ref,
        "status": booking.status,
        "payment_status": booking.payment_status,
        "guest_name": guest_name,
        "guest_email": booking.guest.email if booking.guest else "",
        "room_name": room_name,
        "room_number": room_number,
        "check_in": str(booking.check_in),
        "check_out": str(booking.check_out),
        "num_guests": booking.num_guests,
        "total_price": float(booking.total_price),
        "special_requests": booking.special_requests,
        "booked_at": str(booking.booked_at) if booking.booked_at else None,
    }


@router.delete("/{booking_ref}")
async def cancel_booking(booking_ref: str, db: AsyncSession = Depends(get_db)):
    """Cancel a booking by reference number."""
    try:
        booking = await queries.cancel_booking(db, booking_ref)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {
        "booking_ref": booking.booking_ref,
        "status": booking.status,
        "payment_status": booking.payment_status,
    }
