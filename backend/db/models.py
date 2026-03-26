"""SQLAlchemy ORM models for Grand Meridian Resort."""
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, Date, DateTime,
    ForeignKey, CheckConstraint, UniqueConstraint, func, Numeric
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, relationship
import uuid


class Base(DeclarativeBase):
    pass


class Wing(Base):
    __tablename__ = "wings"
    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    floor_count = Column(Integer, default=5)
    position_x = Column(Float, default=0)
    position_y = Column(Float, default=0)
    position_z = Column(Float, default=0)
    rooms = relationship("Room", back_populates="wing")


class RoomType(Base):
    __tablename__ = "room_types"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    base_price_min = Column(Numeric(10, 2), nullable=False)
    base_price_max = Column(Numeric(10, 2), nullable=False)
    max_occupancy = Column(Integer, default=2)
    size_sqft = Column(Integer)
    tier = Column(String(20))
    rooms = relationship("Room", back_populates="room_type")


class Room(Base):
    __tablename__ = "rooms"
    id = Column(Integer, primary_key=True)
    room_number = Column(String(20), unique=True, nullable=False)
    room_name = Column(String(100), unique=True, nullable=False)
    room_type_id = Column(Integer, ForeignKey("room_types.id"), nullable=False)
    wing_id = Column(Integer, ForeignKey("wings.id"), nullable=False)
    floor = Column(Integer, nullable=False)
    view_type = Column(String(30))
    capacity = Column(Integer, default=2)
    base_price = Column(Numeric(10, 2), nullable=False)
    amenities = Column(JSONB, default=[])
    description = Column(Text)
    photo_urls = Column(JSONB, default=[])
    is_active = Column(Boolean, default=True)
    position_x = Column(Float, default=0)
    position_y = Column(Float, default=0)
    position_z = Column(Float, default=0)
    mesh_id = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())

    wing = relationship("Wing", back_populates="rooms")
    room_type = relationship("RoomType", back_populates="rooms")
    bookings = relationship("Booking", back_populates="room")
    reviews = relationship("Review", back_populates="room")


class Guest(Base):
    __tablename__ = "guests"
    id = Column(Integer, primary_key=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    phone = Column(String(30))
    nationality = Column(String(60))
    id_proof_type = Column(String(30))
    id_proof_number = Column(String(50))
    date_of_birth = Column(Date)
    preferences = Column(JSONB, default={})
    loyalty_tier = Column(String(20), default="bronze")
    total_stays = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

    bookings = relationship("Booking", back_populates="guest")
    reviews = relationship("Review", back_populates="guest")
    payments = relationship("PaymentHistory", back_populates="guest")


class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True)
    booking_ref = Column(String(20), unique=True, nullable=False)
    guest_id = Column(Integer, ForeignKey("guests.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    check_in = Column(Date, nullable=False)
    check_out = Column(Date, nullable=False)
    num_guests = Column(Integer, default=1)
    status = Column(String(20), default="confirmed")
    total_price = Column(Numeric(10, 2), nullable=False)
    special_requests = Column(Text)
    payment_status = Column(String(20), default="paid")
    booked_via = Column(String(20), default="website")
    booked_at = Column(DateTime, server_default=func.now())
    cancelled_at = Column(DateTime)

    guest = relationship("Guest", back_populates="bookings")
    room = relationship("Room", back_populates="bookings")
    addons = relationship("BookingAddon", back_populates="booking", cascade="all, delete-orphan")
    payments = relationship("PaymentHistory", back_populates="booking", cascade="all, delete-orphan")
    review = relationship("Review", back_populates="booking", uselist=False)


class BookingAddon(Base):
    __tablename__ = "booking_addons"
    id = Column(Integer, primary_key=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    addon_type = Column(String(30), nullable=False)
    addon_name = Column(String(100), nullable=False)
    details = Column(JSONB, default={})
    price = Column(Numeric(10, 2), nullable=False)
    quantity = Column(Integer, default=1)
    scheduled_date = Column(Date)
    status = Column(String(20), default="confirmed")

    booking = relationship("Booking", back_populates="addons")


class PaymentHistory(Base):
    __tablename__ = "payment_history"
    id = Column(Integer, primary_key=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    guest_id = Column(Integer, ForeignKey("guests.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), default="USD")
    transaction_type = Column(String(30), nullable=False, default="charge")
    payment_method = Column(String(30), nullable=False, default="card")
    gateway = Column(String(30), default="stripe")
    gateway_txn_id = Column(String(100), unique=True)
    status = Column(String(20), nullable=False, default="succeeded")
    attempt_no = Column(Integer, default=1)
    notes = Column(Text)
    metadata_ = Column("metadata", JSONB, default={})
    processed_at = Column(DateTime, server_default=func.now())

    booking = relationship("Booking", back_populates="payments")
    guest = relationship("Guest", back_populates="payments")


class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False)
    guest_id = Column(Integer, ForeignKey("guests.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    overall_rating = Column(Integer)
    cleanliness_rating = Column(Integer)
    service_rating = Column(Integer)
    location_rating = Column(Integer)
    value_rating = Column(Integer)
    title = Column(String(200))
    comment = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    booking = relationship("Booking", back_populates="review")
    guest = relationship("Guest", back_populates="reviews")
    room = relationship("Room", back_populates="reviews")


class Manager(Base):
    __tablename__ = "managers"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), default="manager")
    permissions = Column(JSONB, default={})
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())


class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(Integer, primary_key=True)
    session_id = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True)
    guest_id = Column(Integer, ForeignKey("guests.id"))
    guest_name = Column(String(100))
    started_at = Column(DateTime, server_default=func.now())
    ended_at = Column(DateTime)
    messages = Column(JSONB, default=[])
    agent_type = Column(String(30), default="concierge")
    outcome = Column(String(30))
    created_booking_id = Column(Integer, ForeignKey("bookings.id"))


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"
    id = Column(Integer, primary_key=True)
    event_type = Column(String(50), nullable=False)
    source = Column(String(30))
    metadata_ = Column("metadata", JSONB, default={})
    reference_type = Column(String(30))  # e.g., "booking", "payment", "room"
    reference_id = Column(Integer)  # FK to referenced entity
    created_at = Column(DateTime, server_default=func.now())


class ManagerChatSession(Base):
    __tablename__ = "manager_chat_sessions"
    id = Column(Integer, primary_key=True)
    session_id = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True)
    manager_id = Column(Integer, ForeignKey("managers.id"), nullable=False)
    started_at = Column(DateTime, server_default=func.now())
    ended_at = Column(DateTime)
    messages = Column(JSONB, default=[])  # stores full conversation history
    status = Column(String(20), default="active")  # active, completed, abandoned
    
    # Relationships
    manager = relationship("Manager", backref="chat_sessions")
    analytics_queries = relationship("ManagerAnalyticsQuery", back_populates="chat_session")


class ManagerAnalyticsQuery(Base):
    __tablename__ = "manager_analytics_queries"
    id = Column(Integer, primary_key=True)
    chat_session_id = Column(Integer, ForeignKey("manager_chat_sessions.id"), nullable=False)
    manager_id = Column(Integer, ForeignKey("managers.id"), nullable=False)
    natural_language_query = Column(Text, nullable=False)  # original user question
    generated_sql = Column(Text, nullable=False)  # SQL generated by agent
    chart_type = Column(String(20))  # line, bar, pie, table, etc.
    chart_config = Column(JSONB, default={})  # {x_axis, y_axis, title, x_label, y_label}
    result_data = Column(JSONB, default=[])  # query result rows as list of dicts
    insights = Column(Text)  # AI-generated business insights
    execution_ms = Column(Integer)  # query execution time in milliseconds
    status = Column(String(20), default="success")  # success, error, timeout
    error_message = Column(Text)  # error details if status != success
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    chat_session = relationship("ManagerChatSession", back_populates="analytics_queries")
    manager = relationship("Manager", backref="analytics_queries")
