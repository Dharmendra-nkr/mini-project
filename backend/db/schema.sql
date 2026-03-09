-- Grand Meridian Resort — Database Schema
-- PostgreSQL 13+ | Database: mini

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Resort Wings
CREATE TABLE wings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    floor_count INT DEFAULT 5,
    position_x FLOAT DEFAULT 0,
    position_y FLOAT DEFAULT 0,
    position_z FLOAT DEFAULT 0
);

-- Room Types (10 tiers)
CREATE TABLE room_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    base_price_min DECIMAL(10,2) NOT NULL,
    base_price_max DECIMAL(10,2) NOT NULL,
    max_occupancy INT NOT NULL DEFAULT 2,
    size_sqft INT,
    tier VARCHAR(20) CHECK (tier IN ('standard','deluxe','premium','suite','villa','penthouse'))
);

-- Rooms (120 total: 4 wings x 5 floors x 6 rooms)
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    room_number VARCHAR(20) NOT NULL UNIQUE,
    room_name VARCHAR(100) NOT NULL UNIQUE,
    room_type_id INT NOT NULL REFERENCES room_types(id),
    wing_id INT NOT NULL REFERENCES wings(id),
    floor INT NOT NULL CHECK (floor BETWEEN 1 AND 10),
    view_type VARCHAR(30) CHECK (view_type IN ('ocean','ocean_panoramic','garden','pool','beach','sunset','marina','courtyard')),
    capacity INT NOT NULL DEFAULT 2,
    base_price DECIMAL(10,2) NOT NULL,
    amenities JSONB DEFAULT '[]',
    description TEXT,
    photo_urls JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    position_x FLOAT DEFAULT 0,
    position_y FLOAT DEFAULT 0,
    position_z FLOAT DEFAULT 0,
    mesh_id VARCHAR(50),  -- Maps to 3D model mesh name
    created_at TIMESTAMP DEFAULT NOW()
);

-- Guests
CREATE TABLE guests (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(30),
    nationality VARCHAR(60),
    id_proof_type VARCHAR(30),
    id_proof_number VARCHAR(50),
    date_of_birth DATE,
    preferences JSONB DEFAULT '{}',
    loyalty_tier VARCHAR(20) DEFAULT 'bronze' CHECK (loyalty_tier IN ('bronze','silver','gold','platinum')),
    total_stays INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bookings
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    booking_ref VARCHAR(20) NOT NULL UNIQUE,
    guest_id INT NOT NULL REFERENCES guests(id),
    room_id INT NOT NULL REFERENCES rooms(id),
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    num_guests INT DEFAULT 1,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','checked_in','checked_out','cancelled','no_show')),
    total_price DECIMAL(10,2) NOT NULL,
    special_requests TEXT,
    payment_status VARCHAR(20) DEFAULT 'paid' CHECK (payment_status IN ('pending','paid','refunded','partial')),
    booked_via VARCHAR(20) DEFAULT 'website' CHECK (booked_via IN ('website','phone','walk_in','agent','partner')),
    booked_at TIMESTAMP DEFAULT NOW(),
    cancelled_at TIMESTAMP,
    CHECK (check_out > check_in)
);

-- Booking Add-ons
CREATE TABLE booking_addons (
    id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    addon_type VARCHAR(30) NOT NULL CHECK (addon_type IN ('spa','dining','tour','transport','activity','package')),
    addon_name VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}',
    price DECIMAL(10,2) NOT NULL,
    quantity INT DEFAULT 1,
    scheduled_date DATE,
    status VARCHAR(20) DEFAULT 'confirmed'
);

-- Reviews
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
    guest_id INT NOT NULL REFERENCES guests(id),
    room_id INT NOT NULL REFERENCES rooms(id),
    overall_rating INT CHECK (overall_rating BETWEEN 1 AND 5),
    cleanliness_rating INT CHECK (cleanliness_rating BETWEEN 1 AND 5),
    service_rating INT CHECK (service_rating BETWEEN 1 AND 5),
    location_rating INT CHECK (location_rating BETWEEN 1 AND 5),
    value_rating INT CHECK (value_rating BETWEEN 1 AND 5),
    title VARCHAR(200),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Managers
CREATE TABLE managers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) DEFAULT 'manager' CHECK (role IN ('admin','manager','front_desk','housekeeping')),
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Chat Sessions
CREATE TABLE chat_sessions (
    id SERIAL PRIMARY KEY,
    session_id UUID DEFAULT uuid_generate_v4() UNIQUE,
    guest_id INT REFERENCES guests(id),
    guest_name VARCHAR(100),
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    messages JSONB DEFAULT '[]',
    agent_type VARCHAR(30) DEFAULT 'concierge',
    outcome VARCHAR(30),
    created_booking_id INT REFERENCES bookings(id)
);

-- Analytics Events
CREATE TABLE analytics_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    source VARCHAR(30),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_rooms_wing ON rooms(wing_id);
CREATE INDEX idx_rooms_type ON rooms(room_type_id);
CREATE INDEX idx_rooms_view ON rooms(view_type);
CREATE INDEX idx_rooms_floor ON rooms(floor);
CREATE INDEX idx_rooms_active ON rooms(is_active);
CREATE INDEX idx_bookings_guest ON bookings(guest_id);
CREATE INDEX idx_bookings_room ON bookings(room_id);
CREATE INDEX idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_ref ON bookings(booking_ref);
CREATE INDEX idx_reviews_room ON reviews(room_id);
CREATE INDEX idx_reviews_guest ON reviews(guest_id);
CREATE INDEX idx_chat_guest ON chat_sessions(guest_id);
CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_date ON analytics_events(created_at);
