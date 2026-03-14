"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Star, Users, Eye, Waves, SlidersHorizontal, X } from "lucide-react";
import { rooms as roomsApi, Room } from "../../lib/api";

const WINGS = ["All", "Coral Wing", "Horizon Wing", "Palm Wing", "Reef Wing"];
const VIEWS = ["All", "ocean", "garden", "pool", "lagoon", "mountain"];

const WING_STYLES: Record<string, { gradient: string; badge: string }> = {
  "Coral Wing":   { gradient: "from-cyan-600 to-blue-700",   badge: "bg-cyan-500" },
  "Horizon Wing": { gradient: "from-orange-500 to-pink-600", badge: "bg-orange-500" },
  "Palm Wing":    { gradient: "from-emerald-500 to-teal-700",badge: "bg-emerald-500" },
  "Reef Wing":    { gradient: "from-amber-500 to-orange-600",badge: "bg-amber-500" },
};

const TIER_COLORS: Record<string, string> = {
  standard:  "bg-slate-500",
  deluxe:    "bg-blue-600",
  premium:   "bg-purple-600",
  suite:     "bg-[var(--gold)]",
  villa:     "bg-rose-600",
};

function RoomsContent() {
  const searchParams = useSearchParams();
  const [roomList, setRoomList] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [wing, setWing] = useState(() => searchParams.get("wing") || "All");
  const [view, setView] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "rating">("price-asc");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const wingParam = searchParams.get("wing");
    if (wingParam) setWing(wingParam);
  }, [searchParams]);

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

  const hasFilters = wing !== "All" || view !== "All" || search;

  const resetFilters = () => {
    setWing("All");
    setView("All");
    setSearch("");
  };

  return (
    <div className="min-h-screen bg-[var(--sand)] pt-20">
      {/* Hero bar */}
      <div className="bg-resort-hero py-14 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
            Rooms &amp; Suites
          </h1>
          <p className="text-white/70 max-w-lg text-lg">
            Discover {roomList.length || 120} uniquely designed rooms across four luxurious wings.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-6 -mt-6 mb-2">
        <div className="glass-light rounded-2xl p-4 shadow-lg">
          {/* Search + Toggle */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1 bg-[var(--sand)] rounded-full px-4 py-2">
              <Search size={15} className="text-[var(--muted)] shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search rooms by name or number..."
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-[var(--muted)]"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-[var(--muted)] hover:text-[var(--navy)]">
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full border transition ${
                showFilters || hasFilters
                  ? "bg-[var(--gold)] text-white border-[var(--gold)]"
                  : "border-black/10 text-[var(--foreground)] hover:border-[var(--gold)]"
              }`}
            >
              <SlidersHorizontal size={14} />
              <span className="hidden sm:inline">Filters</span>
              {hasFilters && (
                <span className="w-4 h-4 rounded-full bg-white text-[var(--gold)] text-[10px] font-bold flex items-center justify-center">
                  {[wing !== "All", view !== "All", search !== ""].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-black/5 flex flex-wrap gap-3 items-center">
              <select
                value={wing}
                onChange={(e) => setWing(e.target.value)}
                className="text-sm px-3 py-1.5 rounded-lg border border-black/10 bg-white focus:border-[var(--gold)] focus:outline-none"
              >
                {WINGS.map((w) => (
                  <option key={w} value={w}>{w === "All" ? "All Wings" : w}</option>
                ))}
              </select>

              <select
                value={view}
                onChange={(e) => setView(e.target.value)}
                className="text-sm px-3 py-1.5 rounded-lg border border-black/10 bg-white capitalize focus:border-[var(--gold)] focus:outline-none"
              >
                {VIEWS.map((v) => (
                  <option key={v} value={v}>{v === "All" ? "All Views" : v + " view"}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="text-sm px-3 py-1.5 rounded-lg border border-black/10 bg-white focus:border-[var(--gold)] focus:outline-none"
              >
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="rating">Top Rated</option>
              </select>

              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className="text-sm text-[var(--muted)] hover:text-red-500 flex items-center gap-1 transition"
                >
                  <X size={13} /> Reset filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Room Grid */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <p className="text-sm text-[var(--muted)] mb-6">
          Showing <span className="font-semibold text-[var(--navy)]">{filtered.length}</span> of{" "}
          <span className="font-semibold">{roomList.length}</span> rooms
        </p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-black/5 animate-pulse">
                <div className="h-48 bg-slate-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((room, i) => {
              const wingStyle = WING_STYLES[room.wing || ""] || {
                gradient: "from-[var(--navy)] to-[var(--ocean)]",
                badge: "bg-[var(--navy)]",
              };
              const tierColor = TIER_COLORS[room.tier?.toLowerCase() || ""] || "bg-slate-500";
              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4) }}
                >
                  <Link href={`/rooms/${room.id}`}>
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group border border-black/5 h-full flex flex-col">
                      {/* Image area */}
                      <div className={`h-48 bg-gradient-to-br ${wingStyle.gradient} relative overflow-hidden`}>
                        <div className="absolute inset-0 flex items-end justify-center pb-3 opacity-10 group-hover:opacity-20 transition">
                          <Waves size={72} className="text-white" />
                        </div>

                        {/* Badges row */}
                        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                          {room.tier && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tierColor} text-white uppercase tracking-wide`}>
                              {room.tier}
                            </span>
                          )}
                          {room.wing && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/25 text-white backdrop-blur-sm`}>
                              {room.wing}
                            </span>
                          )}
                        </div>

                        {/* Price */}
                        <span className="absolute bottom-3 right-3 text-sm font-bold bg-black/40 text-white px-3 py-1 rounded-full backdrop-blur-sm">
                          ${room.base_price}
                          <span className="text-xs font-normal">/night</span>
                        </span>

                        {/* Rating overlay */}
                        {room.avg_rating && (
                          <span className="absolute bottom-3 left-3 flex items-center gap-1 text-xs font-semibold bg-black/30 text-white px-2 py-1 rounded-full backdrop-blur-sm">
                            <Star size={10} fill="white" />
                            {room.avg_rating.toFixed(1)}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-bold text-[var(--navy)] group-hover:text-[var(--gold)] transition leading-snug">
                          {room.room_name}
                        </h3>
                        <p className="text-xs text-[var(--muted)] mt-0.5">
                          {room.room_number} &middot; Floor {room.floor}
                        </p>

                        {room.description && (
                          <p className="text-xs text-[var(--muted)] mt-2 line-clamp-2 leading-relaxed flex-1">
                            {room.description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-black/5 text-xs text-[var(--muted)]">
                          <span className="flex items-center gap-1">
                            <Users size={12} /> {room.capacity} guests
                          </span>
                          <span className="flex items-center gap-1 capitalize">
                            <Eye size={12} /> {room.view_type}
                          </span>
                          {room.review_count ? (
                            <span className="ml-auto text-[var(--muted)]">
                              {room.review_count} review{room.review_count !== 1 ? "s" : ""}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-full bg-[var(--sand-dark)] flex items-center justify-center mx-auto mb-4">
              <Search size={28} className="text-[var(--muted)]" />
            </div>
            <p className="text-lg font-semibold text-[var(--navy)] mb-1">No rooms found</p>
            <p className="text-sm text-[var(--muted)] mb-6">Try adjusting your filters or search terms.</p>
            <button
              onClick={resetFilters}
              className="text-sm font-medium bg-[var(--gold)] text-white px-6 py-2.5 rounded-full hover:bg-[var(--gold-light)] hover:text-[var(--navy)] transition"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RoomsPage() {
  return (
    <Suspense>
      <RoomsContent />
    </Suspense>
  );
}
