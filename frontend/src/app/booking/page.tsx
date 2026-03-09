"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Calendar, BedDouble, User, AlertCircle, XCircle } from "lucide-react";
import { bookings as bookingsApi } from "../../lib/api";

export default function BookingLookupPage() {
  const [ref, setRef] = useState("");
  const [booking, setBooking] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ref.trim()) return;
    setError("");
    setBooking(null);
    setCancelSuccess(false);
    setLoading(true);
    try {
      const data = await bookingsApi.lookup(ref.trim().toUpperCase());
      setBooking(data);
    } catch {
      setError("Booking not found. Please check your reference number.");
    }
    setLoading(false);
  };

  const handleCancel = async () => {
    if (!ref.trim()) return;
    setLoading(true);
    try {
      await bookingsApi.cancel(ref.trim().toUpperCase());
      setCancelSuccess(true);
      setBooking(null);
    } catch {
      setError("Unable to cancel this booking.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--sand)] pt-20">
      <div className="bg-resort-hero py-12 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Booking Lookup
          </h1>
          <p className="text-white/70">
            Enter your booking reference to view or manage your reservation.
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 -mt-6">
        {/* Search form */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-black/5">
          <form onSubmit={handleLookup} className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-[var(--sand)] rounded-full px-4">
              <Search size={16} className="text-[var(--muted)]" />
              <input
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder="e.g. GMR-20260315-7F2A"
                className="flex-1 text-sm py-3 bg-transparent outline-none placeholder:text-[var(--muted)] uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !ref.trim()}
              className="px-5 py-3 rounded-full bg-[var(--gold)] text-white text-sm font-semibold hover:bg-[var(--gold-light)] hover:text-[var(--navy)] disabled:opacity-50 transition-all"
            >
              {loading ? "Searching..." : "Look Up"}
            </button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 rounded-xl bg-red-50 text-red-700 text-sm flex items-center gap-2"
          >
            <AlertCircle size={16} /> {error}
          </motion.div>
        )}

        {/* Cancel success */}
        {cancelSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 rounded-xl bg-green-50 text-green-700 text-sm flex items-center gap-2"
          >
            <XCircle size={16} /> Booking has been cancelled successfully.
          </motion.div>
        )}

        {/* Booking details */}
        {booking && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-white rounded-2xl p-6 shadow-lg border border-black/5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-[var(--navy)]">Reservation Details</h2>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${
                  booking.status === "confirmed"
                    ? "bg-green-100 text-green-700"
                    : booking.status === "cancelled"
                    ? "bg-red-100 text-red-700"
                    : booking.status === "checked_out"
                    ? "bg-gray-100 text-gray-600"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {String(booking.status || "")}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 p-3 bg-[var(--sand)] rounded-lg">
                <Search size={16} className="text-[var(--gold)]" />
                <div>
                  <span className="text-[var(--muted)]">Reference: </span>
                  <span className="font-bold font-mono">{String(booking.booking_ref || "")}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-[var(--sand)] rounded-lg">
                <User size={16} className="text-[var(--gold)]" />
                <div>
                  <span className="text-[var(--muted)]">Guest: </span>
                  <span className="font-medium">{String(booking.guest_name || "")}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-[var(--sand)] rounded-lg">
                <BedDouble size={16} className="text-[var(--gold)]" />
                <div>
                  <span className="text-[var(--muted)]">Room: </span>
                  <span className="font-medium">
                    {String(booking.room_name || booking.room_number || "")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-[var(--sand)] rounded-lg">
                <Calendar size={16} className="text-[var(--gold)]" />
                <div>
                  <span className="text-[var(--muted)]">Dates: </span>
                  <span className="font-medium">
                    {String(booking.check_in || "")} → {String(booking.check_out || "")}
                  </span>
                </div>
              </div>

              {booking.total_price != null && (
                <div className="flex justify-between items-center p-3 bg-[var(--sand)] rounded-lg">
                  <span className="text-[var(--muted)]">Total Price</span>
                  <span className="text-xl font-bold text-[var(--gold)]">
                    ${String(booking.total_price)}
                  </span>
                </div>
              )}
            </div>

            {booking.status === "confirmed" && (
              <button
                onClick={handleCancel}
                disabled={loading}
                className="mt-6 w-full py-2.5 rounded-full border-2 border-red-300 text-red-600 text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition"
              >
                Cancel Reservation
              </button>
            )}
          </motion.div>
        )}
      </div>

      <div className="h-20" />
    </div>
  );
}
