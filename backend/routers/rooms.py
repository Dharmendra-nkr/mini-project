"""Rooms router — list rooms, details, availability map for 3D viewer."""
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_db
from db import queries

router = APIRouter(prefix="/api/rooms", tags=["rooms"])


@router.get("/")
async def list_rooms(
    wing: str | None = None,
    room_type: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    db: AsyncSession = Depends(get_db),
):
    """List all rooms with optional filters."""
    rooms = await queries.get_rooms(
        db, wing=wing, room_type=room_type, min_price=min_price, max_price=max_price
    )
    return {"rooms": [{"id": r.id, "room_number": r.room_number, "room_name": r.room_name,
             "floor": r.floor, "view_type": r.view_type, "capacity": r.capacity,
             "base_price": float(r.base_price), "amenities": r.amenities,
             "description": r.description, "mesh_id": r.mesh_id} for r in rooms],
            "count": len(rooms)}


@router.get("/availability-map")
async def availability_map(
    target_date: date = Query(..., description="Date to check availability for"),
    db: AsyncSession = Depends(get_db),
):
    """Return all rooms with availability status — used by 3D viewer."""
    rooms = await queries.get_availability_map(db, target_date)
    return {"rooms": rooms, "date": str(target_date)}


@router.get("/available")
async def available_rooms(
    check_in: date = Query(...),
    check_out: date = Query(...),
    wing: str | None = None,
    view_type: str | None = None,
    max_price: float | None = None,
    capacity: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Search available rooms for given dates."""
    rooms = await queries.get_available_rooms(
        db,
        check_in=check_in,
        check_out=check_out,
        wing=wing,
        view_type=view_type,
        max_price=max_price,
        capacity=capacity,
    )
    return {"rooms": [{"id": r.id, "room_number": r.room_number, "room_name": r.room_name,
             "floor": r.floor, "view_type": r.view_type, "capacity": r.capacity,
             "base_price": float(r.base_price)} for r in rooms], "count": len(rooms)}


@router.get("/{room_id}")
async def room_detail(room_id: int, db: AsyncSession = Depends(get_db)):
    """Get full details of a single room."""
    room = await queries.get_room_by_id(db, room_id)
    if not room:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Room not found")
    reviews = room.reviews or []
    avg_rating = round(sum(r.overall_rating for r in reviews) / len(reviews), 1) if reviews else None
    return {
        "id": room.id, "room_number": room.room_number, "room_name": room.room_name,
        "floor": room.floor, "view_type": room.view_type, "capacity": room.capacity,
        "base_price": float(room.base_price), "amenities": room.amenities,
        "description": room.description, "photo_urls": room.photo_urls,
        "mesh_id": room.mesh_id, "is_active": room.is_active,
        "wing": room.wing.name if room.wing else None,
        "room_type": room.room_type.name if room.room_type else None,
        "tier": room.room_type.tier if room.room_type else None,
        "avg_rating": avg_rating, "review_count": len(reviews),
    }
