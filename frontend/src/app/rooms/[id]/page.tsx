"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Star, Users, Eye, MapPin, Waves,
  Calendar, CheckCircle, AlertCircle,
} from "lucide-react";
import { rooms as roomsApi, bookings as bookingsApi, Room, BookingResult } from "../../../lib/api";

export default function RoomDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  // Booking form
  const [showBooking, setShowBooking] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [numGuests, setNumGuests] = useState(1);
  const [specialReqs, setSpecialReqs] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [bookingError, setBookingError] = useState("");

  // Calculate nights and total price
  const nights =
    checkIn && checkOut
      ? Math.max(
          0,
          Math.round(
            (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
              86400000
          )
        )
      : 0;
  const totalEstimate = room ? nights * room.base_price : 0;

  useEffect(() => {
    if (!id) return;
    roomsApi
      .detail(Number(id))
      .then(setRoom)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setBookingError("");
    try {
      const result = await bookingsApi.create({
        room_id: Number(id),
        check_in: checkIn,
        check_out: checkOut,
        guest_first_name: firstName,
        guest_last_name: lastName,
        guest_email: email,
        guest_phone: phone || undefined,
        num_guests: numGuests,
        special_requests: specialReqs || undefined,
      });
      setBookingResult(result);
    } catch (err: unknown) {
      setBookingError(err instanceof Error ? err.message : "Booking failed");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--sand)]">
        <div className="w-10 h-10 border-4 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--sand)] pt-20 gap-4">
        <p className="text-[var(--muted)]">Room not found.</p>
        <button onClick={() => router.push("/rooms")} className="text-[var(--gold)] underline text-sm">
          Back to Rooms
        </button>
      </div>
    );
  }

  // Booking success view
  if (bookingResult) {
    return (
      <div className="min-h-screen bg-[var(--sand)] pt-24 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg mx-auto bg-white rounded-2xl p-8 shadow-xl text-center"
        >
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[var(--navy)] mb-2">Booking Confirmed!</h2>
          <p className="text-[var(--muted)] mb-6">Your reservation at Grand Meridian Resort is confirmed.</p>

          <div className="bg-[var(--sand)] rounded-xl p-4 text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Reference:</span>
              <span className="font-bold text-[var(--navy)]">{bookingResult.booking_ref}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Room:</span>
              <span className="font-medium">{room.room_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Check-in:</span>
              <span>{bookingResult.check_in}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Check-out:</span>
              <span>{bookingResult.check_out}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Total:</span>
              <span className="font-bold text-[var(--gold)]">${bookingResult.total_price}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Status:</span>
              <span className="text-green-600 capitalize">{bookingResult.status}</span>
            </div>
          </div>

          <button
            onClick={() => router.push("/rooms")}
            className="mt-6 rounded-full bg-[var(--gold)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--gold-light)] hover:text-[var(--navy)] transition-all"
          >
            Browse More Rooms
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--sand)] pt-20">
      {/* Header image */}
      <div className="h-64 md:h-80 bg-gradient-to-br from-[var(--navy)] to-[var(--ocean)] relative flex items-center justify-center">
        <Waves size={80} className="text-white/10" />
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 glass rounded-full px-4 py-2 text-white text-sm flex items-center gap-2 hover:bg-white/20 transition"
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 -mt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="p-6 md:p-8">
            {/* Title row */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--navy)]">
                  {room.room_name}
                </h1>
                <p className="text-[var(--muted)] mt-1 flex items-center gap-2">
                  <MapPin size={14} /> {room.wing} · {room.room_number} · Floor {room.floor}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-[var(--gold)]">
                  ${room.base_price}
                  <span className="text-sm font-normal text-[var(--muted)]">/night</span>
                </p>
                {room.avg_rating && (
                  <p className="flex items-center gap-1 justify-end mt-1 text-sm text-[var(--gold)]">
                    <Star size={14} fill="currentColor" />
                    {room.avg_rating.toFixed(1)}
                    {room.review_count && (
                      <span className="text-[var(--muted)]">({room.review_count} reviews)</span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              {room.tier && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--gold)] text-white uppercase">
                  {room.tier}
                </span>
              )}
              <span className="text-xs px-3 py-1 rounded-full bg-[var(--sand)] text-[var(--foreground)] flex items-center gap-1">
                <Users size={12} /> {room.capacity} Guests
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-[var(--sand)] text-[var(--foreground)] flex items-center gap-1 capitalize">
                <Eye size={12} /> {room.view_type} View
              </span>
              {room.room_type && (
                <span className="text-xs px-3 py-1 rounded-full bg-[var(--sand)] text-[var(--foreground)]">
                  {room.room_type}
                </span>
              )}
            </div>

            {/* Description */}
            {room.description && (
              <p className="mt-6 text-[var(--foreground)] leading-relaxed">{room.description}</p>
            )}

            {/* Amenities */}
            {room.amenities && room.amenities.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-[var(--navy)] mb-3">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {room.amenities.map((a) => (
                    <span key={a} className="text-xs px-3 py-1.5 rounded-full border border-[var(--gold)]/30 text-[var(--foreground)]">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Book Now button */}
            {!showBooking && (
              <button
                onClick={() => setShowBooking(true)}
                className="mt-8 w-full rounded-full bg-[var(--gold)] px-6 py-3 text-base font-semibold text-white hover:bg-[var(--gold-light)] hover:text-[var(--navy)] transition-all"
              >
                <Calendar size={18} className="inline mr-2" />
                Book This Room
              </button>
            )}
          </div>

          {/* Booking Form */}
          {showBooking && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="border-t border-black/5 p-6 md:p-8 bg-[var(--sand)]"
            >
              <h3 className="font-bold text-lg text-[var(--navy)] mb-4">Complete Your Reservation</h3>

              {bookingError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle size={16} /> {bookingError}
                </div>
              )}

              <form onSubmit={handleBooking} className="space-y-4">
                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted)] mb-1">Check-in</label>
                    <input
                      type="date"
                      required
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full text-sm px-3 py-2 rounded-lg border border-black/10 focus:border-[var(--gold)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted)] mb-1">Check-out</label>
                    <input
                      type="date"
                      required
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      min={checkIn || new Date().toISOString().split("T")[0]}
                      className="w-full text-sm px-3 py-2 rounded-lg border border-black/10 focus:border-[var(--gold)] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Guest info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted)] mb-1">First Name</label>
                    <input
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full text-sm px-3 py-2 rounded-lg border border-black/10 focus:border-[var(--gold)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted)] mb-1">Last Name</label>
                    <input
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full text-sm px-3 py-2 rounded-lg border border-black/10 focus:border-[var(--gold)] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted)] mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-sm px-3 py-2 rounded-lg border border-black/10 focus:border-[var(--gold)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted)] mb-1">Phone (optional)</label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-sm px-3 py-2 rounded-lg border border-black/10 focus:border-[var(--gold)] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--muted)] mb-1">Number of Guests</label>
                  <input
                    type="number"
                    min={1}
                    max={room.capacity}
                    value={numGuests}
                    onChange={(e) => setNumGuests(Number(e.target.value))}
                    className="w-24 text-sm px-3 py-2 rounded-lg border border-black/10 focus:border-[var(--gold)] focus:outline-none"
                  />
                  <span className="text-xs text-[var(--muted)] ml-2">Max: {room.capacity}</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--muted)] mb-1">Special Requests (optional)</label>
                  <textarea
                    value={specialReqs}
                    onChange={(e) => setSpecialReqs(e.target.value)}
                    rows={2}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-black/10 focus:border-[var(--gold)] focus:outline-none resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting || nights === 0}
                    className="flex-1 rounded-full bg-[var(--gold)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--gold-light)] hover:text-[var(--navy)] disabled:opacity-50 transition-all"
                  >
                    {submitting ? "Processing..." : "Confirm Booking"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBooking(false)}
                    className="px-6 py-3 text-sm font-medium text-[var(--muted)] hover:text-[var(--navy)] transition"
                  >
                    Cancel
                  </button>
                </div>

                {/* Price summary */}
                {nights > 0 && (
                  <div className="mt-2 p-3 rounded-xl bg-white border border-[var(--gold)]/20 text-sm flex items-center justify-between">
                    <span className="text-[var(--muted)]">
                      ${room.base_price} &times; {nights} night{nights !== 1 ? "s" : ""}
                    </span>
                    <span className="font-bold text-[var(--gold)] text-base">
                      ${totalEstimate.toFixed(0)}
                    </span>
                  </div>
                )}
              </form>
            </motion.div>
          )}
        </motion.div>
      </div>

      <div className="h-20" />
    </div>
  );
}
