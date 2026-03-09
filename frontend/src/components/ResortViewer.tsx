"use client";

import { useRef, useState, useMemo, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Html } from "@react-three/drei";
import * as THREE from "three";
import { AvailabilityRoom } from "../lib/api";

// ─── Color palette ───
const COLORS = {
  available: "#22c55e",
  occupied: "#ef4444",
  selected: "#c9a84c",
  hovered: "#0ea5e9",
  wing_coral: "#06b6d4",
  wing_horizon: "#f97316",
  wing_palm: "#10b981",
  wing_reef: "#eab308",
};

const WING_POSITIONS: Record<string, [number, number, number]> = {
  "Coral Wing": [-30, 0, 0],
  "Horizon Wing": [30, 0, 0],
  "Palm Wing": [0, 0, -30],
  "Reef Wing": [0, 0, 30],
};

const WING_COLORS: Record<string, string> = {
  "Coral Wing": COLORS.wing_coral,
  "Horizon Wing": COLORS.wing_horizon,
  "Palm Wing": COLORS.wing_palm,
  "Reef Wing": COLORS.wing_reef,
};

// ─── Single Room Box ───
function RoomBox({
  room,
  isSelected,
  onSelect,
}: {
  room: AvailabilityRoom;
  isSelected: boolean;
  onSelect: (room: AvailabilityRoom) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const color = isSelected
    ? COLORS.selected
    : hovered
    ? COLORS.hovered
    : room.available
    ? COLORS.available
    : COLORS.occupied;

  useFrame(() => {
    if (meshRef.current) {
      const target = isSelected ? 1.15 : hovered ? 1.08 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(target, target, target), 0.1);
    }
  });

  return (
    <group position={[room.position.x, room.position.y, room.position.z]}>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "default";
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(room);
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[3.5, 2.5, 3]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={isSelected ? 1 : hovered ? 0.95 : 0.8}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* Room number label */}
      {(hovered || isSelected) && (
        <Html
          position={[0, 2, 0]}
          center
          distanceFactor={40}
          style={{ pointerEvents: "none" }}
        >
          <div className="bg-white/95 rounded-lg px-3 py-1.5 shadow-lg border border-black/10 whitespace-nowrap">
            <p className="text-xs font-bold text-[var(--navy)]">{room.room_name}</p>
            <p className="text-[10px] text-[var(--muted)]">
              {room.room_number} · ${room.base_price}/night ·{" "}
              {room.available ? "Available" : "Occupied"}
            </p>
          </div>
        </Html>
      )}
    </group>
  );
}

// ─── Wing Base Platform ───
function WingPlatform({ wing, color }: { wing: string; color: string }) {
  const pos = WING_POSITIONS[wing] || [0, 0, 0];
  return (
    <group position={[pos[0], -1.5, pos[2]]}>
      <mesh receiveShadow>
        <boxGeometry args={[28, 0.5, 22]} />
        <meshStandardMaterial color={color} opacity={0.15} transparent />
      </mesh>
      <Text
        position={[0, 0.5, 12]}
        fontSize={2}
        color={color}
        anchorX="center"
        anchorY="middle"
        font="/fonts/GeistVF.woff"
      >
        {wing}
      </Text>
    </group>
  );
}

// ─── Water / ground plane ───
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]} receiveShadow>
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial color="#0c4a6e" opacity={0.3} transparent />
    </mesh>
  );
}

// ─── Main Scene ───
function ResortScene({
  rooms,
  selectedRoom,
  onSelectRoom,
}: {
  rooms: AvailabilityRoom[];
  selectedRoom: AvailabilityRoom | null;
  onSelectRoom: (room: AvailabilityRoom) => void;
}) {
  const wings = useMemo(
    () => Array.from(new Set(rooms.map((r) => r.wing).filter((w): w is string => !!w))),
    [rooms]
  );

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[50, 60, 30]} intensity={1} castShadow />
      <pointLight position={[-30, 20, -30]} intensity={0.4} color="#0ea5e9" />

      <Ground />

      {wings.map((wing) => (
        <WingPlatform key={wing} wing={wing} color={WING_COLORS[wing] || "#888"} />
      ))}

      {rooms.map((room) => (
        <RoomBox
          key={room.id}
          room={room}
          isSelected={selectedRoom?.id === room.id}
          onSelect={onSelectRoom}
        />
      ))}

      <OrbitControls
        makeDefault
        maxPolarAngle={Math.PI / 2.2}
        minDistance={20}
        maxDistance={120}
        target={[0, 5, 0]}
        enableDamping
      />
    </>
  );
}

// ─── Legend ───
function Legend() {
  return (
    <div className="absolute top-4 left-4 glass-light rounded-xl px-4 py-3 space-y-2 z-10">
      <p className="text-xs font-bold text-[var(--navy)] mb-2">Room Status</p>
      {[
        { color: COLORS.available, label: "Available" },
        { color: COLORS.occupied, label: "Occupied" },
        { color: COLORS.selected, label: "Selected" },
      ].map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-xs text-[var(--foreground)]">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Room Info Panel ───
function RoomPanel({
  room,
  onClose,
  onBook,
}: {
  room: AvailabilityRoom;
  onClose: () => void;
  onBook: (room: AvailabilityRoom) => void;
}) {
  return (
    <div className="absolute bottom-4 right-4 z-10 w-80 glass-light rounded-2xl p-5 shadow-xl animate-slide-up">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-[var(--muted)] hover:text-[var(--navy)] text-lg"
      >
        ×
      </button>
      <h3 className="font-bold text-lg text-[var(--navy)]">{room.room_name}</h3>
      <p className="text-sm text-[var(--muted)]">
        {room.wing} · Floor {room.floor} · {room.room_number}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-[var(--muted)]">Type:</span>{" "}
          <span className="font-medium">{room.type}</span>
        </div>
        <div>
          <span className="text-[var(--muted)]">View:</span>{" "}
          <span className="font-medium capitalize">{room.view_type}</span>
        </div>
        <div>
          <span className="text-[var(--muted)]">Capacity:</span>{" "}
          <span className="font-medium">{room.capacity} guests</span>
        </div>
        <div>
          <span className="text-[var(--muted)]">Price:</span>{" "}
          <span className="font-bold text-[var(--gold)]">${room.base_price}/night</span>
        </div>
      </div>

      <div className="mt-3">
        <span
          className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
            room.available
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {room.available ? "Available" : "Occupied"}
        </span>
      </div>

      {room.available && (
        <button
          onClick={() => onBook(room)}
          className="mt-4 w-full rounded-full bg-[var(--gold)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--gold-light)] hover:text-[var(--navy)] transition-all"
        >
          Book This Room
        </button>
      )}
    </div>
  );
}

// ─── Exported Component ───
export default function ResortViewer({
  rooms,
  onBookRoom,
}: {
  rooms: AvailabilityRoom[];
  onBookRoom?: (room: AvailabilityRoom) => void;
}) {
  const [selected, setSelected] = useState<AvailabilityRoom | null>(null);

  const handleBook = useCallback(
    (room: AvailabilityRoom) => {
      if (onBookRoom) onBookRoom(room);
    },
    [onBookRoom]
  );

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <Legend />

      {selected && (
        <RoomPanel
          room={selected}
          onClose={() => setSelected(null)}
          onBook={handleBook}
        />
      )}

      <Canvas
        shadows
        camera={{ position: [60, 45, 60], fov: 50 }}
        style={{ background: "linear-gradient(180deg, #0c1b2a 0%, #1a3a5c 100%)" }}
      >
        <ResortScene
          rooms={rooms}
          selectedRoom={selected}
          onSelectRoom={setSelected}
        />
      </Canvas>
    </div>
  );
}
