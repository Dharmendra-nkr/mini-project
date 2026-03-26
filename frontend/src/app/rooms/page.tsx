"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Star, Users, Eye, Waves } from "lucide-react";
import { rooms as roomsApi, Room } from "../../lib/api";

const WINGS = ["All", "Coral Wing", "Horizon Wing", "Palm Wing", "Reef Wing"];
const VIEWS = ["All", "ocean", "garden", "pool", "lagoon", "mountain"];

export default function RoomsPage() {
  const [roomList, setRoomList] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [wing, setWing] = useState("All");
  const [view, setView] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "rating">("price-asc");

  const themeGradients = [
    "from-[#0ea5e9] to-[#0369a1]", // ocean
    "from-[#f97316] to-[#c9a84c]", // coral to gold
    "from-[#0c1b2a] to-[#0ea5e9]", // navy to ocean
    "from-[#c9a84c] to-[#e8d48b]", // gold
    "from-[#f5f0e8] to-[#c9a84c]", // sand to gold
  ];

  const getGradient = (index: number) => themeGradients[index % themeGradients.length];

  useEffect(() => {
    roomsApi
      .list()
      .then((res) => setRoomList(res.rooms))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = roomList
    .filter((r) => (wing === "All" ? true : r.wing === wing))
    .filter((r) => (view === "All" ? true : r.view_type === view))
    .filter((r) =>
      search
        ? r.room_name.toLowerCase().includes(search.toLowerCase()) ||
          r.room_number.toLowerCase().includes(search.toLowerCase())
        : true
    )
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.base_price - b.base_price;
      if (sortBy === "price-desc") return b.base_price - a.base_price;
      return (b.avg_rating || 0) - (a.avg_rating || 0);
    });

  return (
    <div className="min-h-screen bg-[var(--sand)] pt-20">
      {/* Hero bar */}
      <div className="bg-resort-hero py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Rooms & Suites
          </h1>
          <p className="text-white/70 max-w-lg">
            Discover 120 uniquely designed rooms across four luxurious wings.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-6 -mt-6">
        <div className="glass-light rounded-2xl p-4 flex flex-wrap items-center gap-4 shadow-lg">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search size={16} className="text-[var(--muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rooms..."
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-[var(--muted)]"
            />
          </div>

          {/* Wing filter */}
          <select
            value={wing}
            onChange={(e) => setWing(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-lg border border-black/10 bg-white"
          >
            {WINGS.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>

          {/* View filter */}
          <select
            value={view}
            onChange={(e) => setView(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-lg border border-black/10 bg-white capitalize"
          >
            {VIEWS.map((v) => (
              <option key={v} value={v}>{v === "All" ? "All Views" : v + " view"}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="text-sm px-3 py-1.5 rounded-lg border border-black/10 bg-white"
          >
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      {/* Room Grid */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <p className="text-sm text-[var(--muted)] mb-6">
          Showing {filtered.length} of {roomList.length} rooms
        </p>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-[var(--gold)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[var(--muted)]">Loading rooms...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((room, i) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.5) }}
              >
                <Link href={`/rooms/${room.id}`}>
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group border border-black/5">
                    {/* Room Image Placeholder with Theme Colors */}
                    <div className={`h-48 bg-gradient-to-br ${getGradient(filtered.indexOf(room))} relative overflow-hidden flex items-center justify-center`}>
                      <div className="text-center text-white/60">
                        <Waves size={32} className="mx-auto mb-2" />
                        <p className="text-xs font-medium">{room.room_type}</p>
                      </div>
                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      {/* Tier badge */}
                      {room.tier && (
                        <span className="absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--gold)] text-white uppercase shadow-md">
                          {room.tier}
                        </span>
                      )}
                      {/* Price */}
                      <span className="absolute bottom-3 right-3 text-sm font-bold bg-black/60 text-white px-3 py-1 rounded-full backdrop-blur-sm">
                        ${room.base_price}<span className="text-xs font-normal">/night</span>
                      </span>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-bold text-[var(--navy)] group-hover:text-[var(--gold)] transition">
                        {room.room_name}
                      </h3>
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        {room.room_number} · Floor {room.floor}
                      </p>

                      <div className="flex items-center gap-4 mt-3 text-xs text-[var(--muted)]">
                        <span className="flex items-center gap-1">
                          <Users size={12} /> {room.capacity}
                        </span>
                        <span className="flex items-center gap-1 capitalize">
                          <Eye size={12} /> {room.view_type}
                        </span>
                        {room.avg_rating && (
                          <span className="flex items-center gap-1 text-[var(--gold)]">
                            <Star size={12} fill="currentColor" />{" "}
                            {room.avg_rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-[var(--muted)]">
            <p className="text-lg mb-2">No rooms match your filters.</p>
            <button
              onClick={() => {
                setWing("All");
                setView("All");
                setSearch("");
              }}
              className="text-sm text-[var(--gold)] underline"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
