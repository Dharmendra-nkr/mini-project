"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { rooms as roomsApi, AvailabilityRoom } from "../../lib/api";

const ResortViewer = dynamic(() => import("../../components/ResortViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[var(--navy)]">
      <div className="text-center text-white">
        <div className="w-12 h-12 border-4 border-[var(--gold)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm opacity-70">Loading 3D Resort Model...</p>
      </div>
    </div>
  ),
});

export default function ExplorePage() {
  const [roomData, setRoomData] = useState<AvailabilityRoom[]>([]);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, available: 0, occupied: 0 });

  useEffect(() => {
    setLoading(true);
    roomsApi
      .availabilityMap(date)
      .then((res) => {
        setRoomData(res.rooms);
        const avail = res.rooms.filter((r) => r.available).length;
        setStats({ total: res.rooms.length, available: avail, occupied: res.rooms.length - avail });
      })
      .catch(() => setRoomData([]))
      .finally(() => setLoading(false));
  }, [date]);

  const handleBookRoom = (room: AvailabilityRoom) => {
    window.location.href = `/rooms/${room.id}`;
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <div className="shrink-0 bg-[var(--navy)] border-b border-white/10 px-6 py-3 flex flex-wrap items-center justify-between gap-4 pt-20">
        <div>
          <h1 className="text-white font-bold text-lg">3D Resort Explorer</h1>
          <p className="text-white/60 text-xs">
            Click any room to view details · Color = availability
          </p>
        </div>

        <div className="flex items-center gap-6">
          {/* Date picker */}
          <div className="flex items-center gap-2">
            <label className="text-white/60 text-xs">Date:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-white/10 text-white text-sm rounded-lg px-3 py-1.5 border border-white/20 focus:border-[var(--gold)] focus:outline-none"
            />
          </div>

          {/* Stats */}
          <div className="hidden sm:flex items-center gap-4 text-xs">
            <span className="text-white/60">
              Total: <span className="text-white font-bold">{stats.total}</span>
            </span>
            <span className="text-green-400">
              Available: <span className="font-bold">{stats.available}</span>
            </span>
            <span className="text-red-400">
              Occupied: <span className="font-bold">{stats.occupied}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center bg-[var(--navy)]">
            <div className="w-10 h-10 border-4 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <ResortViewer rooms={roomData} onBookRoom={handleBookRoom} />
        )}
      </div>
    </div>
  );
}
