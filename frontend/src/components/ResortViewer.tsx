"use client";

import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Html, Sky, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { AvailabilityRoom } from "../lib/api";

/* ═══════════════════════════════════════════════
   COLOR & LAYOUT CONFIG
   ═══════════════════════════════════════════════ */
const C = {
  available: "#22c55e",
  occupied: "#ef4444",
  selected: "#f59e0b",
  hovered: "#38bdf8",
  building: "#e8e0d0",
  roof: "#8B4513",
  glass: "#a8d8ea",
  ground: "#4a7c59",
  sand: "#e8d5a3",
  water: "#0c6e9e",
  waterShallow: "#2eaadc",
  concrete: "#b8b0a0",
  path: "#c4b898",
  poolWater: "#43d9e8",
  poolEdge: "#f5f0e0",
  wood: "#8B6914",
  trunk: "#5c3a1e",
  leaves: "#228B22",
  leavesDark: "#1a6b1a",
  lobby: "#d4c5a0",
};

/* ═══════════════════════════════════════════════
   GLB MODEL LOADER — import custom .glb/.gltf
   ═══════════════════════════════════════════════ */
export function GLBModel({
  url,
  position = [0, 0, 0],
  scale = 1,
  rotation = [0, 0, 0],
}: {
  url: string;
  position?: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
}) {
  const { scene } = useGLTF(url);
  return (
    <primitive
      object={scene.clone()}
      position={position}
      scale={[scale, scale, scale]}
      rotation={rotation}
      castShadow
      receiveShadow
    />
  );
}

const WING_CONFIG: Record<
  string,
  { pos: [number, number, number]; rot: number; color: string }
> = {
  "Coral Wing":   { pos: [-42, 0, 0],  rot: 0,              color: "#06b6d4" },
  "Palm Wing":    { pos: [42, 0, 0],   rot: 0,              color: "#10b981" },
  "Horizon Wing": { pos: [0, 0, -42],  rot: Math.PI / 2,    color: "#f97316" },
  "Reef Wing":    { pos: [0, 0, 42],   rot: Math.PI / 2,    color: "#eab308" },
};

/* ═══════════════════════════════════════════════
   ROOM UNIT — clickable room window on building
   ═══════════════════════════════════════════════ */
function RoomUnit({
  room,
  localX,
  localY,
  localZ,
  isSelected,
  onSelect,
}: {
  room: AvailabilityRoom;
  localX: number;
  localY: number;
  localZ: number;
  isSelected: boolean;
  onSelect: (r: AvailabilityRoom) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const color = isSelected
    ? C.selected
    : hovered
    ? C.hovered
    : room.available
    ? C.available
    : C.occupied;
  const emissiveI = isSelected ? 0.3 : hovered ? 0.15 : 0;

  useFrame(() => {
    if (!meshRef.current) return;
    const s = isSelected ? 1.08 : hovered ? 1.04 : 1;
    meshRef.current.scale.lerp(new THREE.Vector3(s, s, s), 0.12);
  });

  return (
    <group position={[localX, localY, localZ]}>
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
      >
        <boxGeometry args={[3.2, 2.6, 0.3]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveI}
          roughness={0.2}
          metalness={0.3}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Glass pane */}
      <mesh position={[0, 0, 0.17]}>
        <planeGeometry args={[2.6, 1.8]} />
        <meshStandardMaterial
          color={C.glass}
          transparent
          opacity={hovered ? 0.55 : 0.3}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* Tooltip */}
      {(hovered || isSelected) && (
        <Html position={[0, 2.2, 0]} center distanceFactor={60} style={{ pointerEvents: "none" }}>
          <div className="bg-white/95 rounded-lg px-3 py-2 shadow-xl border border-black/10 whitespace-nowrap">
            <p className="text-xs font-bold text-[var(--navy)]">{room.room_name}</p>
            <p className="text-[10px] text-[var(--muted)]">
              {room.room_number} &middot; Floor {room.floor} &middot; ${room.base_price}/night
            </p>
            <p className={`text-[10px] font-semibold ${room.available ? "text-green-600" : "text-red-500"}`}>
              {room.available ? "\u25CF Available" : "\u25CF Occupied"}
            </p>
          </div>
        </Html>
      )}
    </group>
  );
}

/* ═══════════════════════════════════════════════
   BALCONY — glass railing + floor slab per room
   ═══════════════════════════════════════════════ */
function Balcony({ x, y, z, isPenthouse }: { x: number; y: number; z: number; isPenthouse?: boolean }) {
  const depth = isPenthouse ? 3.5 : 2;
  const width = isPenthouse ? 4 : 3.2;
  return (
    <group position={[x, y - 1.1, z + depth / 2 + 0.1]}>
      {/* Floor slab */}
      <mesh castShadow>
        <boxGeometry args={[width, 0.15, depth]} />
        <meshStandardMaterial color={C.concrete} roughness={0.6} />
      </mesh>
      {/* Glass railing front */}
      <mesh position={[0, 0.45, depth / 2 - 0.05]}>
        <boxGeometry args={[width, 0.8, 0.06]} />
        <meshStandardMaterial color="#c8e6f0" transparent opacity={0.35} roughness={0.05} metalness={0.9} />
      </mesh>
      {/* Metal railing top */}
      <mesh position={[0, 0.87, depth / 2 - 0.05]}>
        <boxGeometry args={[width + 0.1, 0.06, 0.08]} />
        <meshStandardMaterial color="#888" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Side railings */}
      {[-width / 2, width / 2].map((sx) => (
        <mesh key={`sr-${sx}`} position={[sx, 0.45, 0]}>
          <boxGeometry args={[0.06, 0.8, depth]} />
          <meshStandardMaterial color="#c8e6f0" transparent opacity={0.3} roughness={0.05} metalness={0.9} />
        </mesh>
      ))}
      {/* Planter box */}
      {!isPenthouse && (
        <mesh position={[width / 2 - 0.5, 0.25, depth / 2 - 0.4]}>
          <boxGeometry args={[0.6, 0.35, 0.5]} />
          <meshStandardMaterial color="#5a3a20" roughness={0.9} />
        </mesh>
      )}
      {/* Plant in planter */}
      {!isPenthouse && (
        <mesh position={[width / 2 - 0.5, 0.55, depth / 2 - 0.4]}>
          <sphereGeometry args={[0.25, 6, 6]} />
          <meshStandardMaterial color="#2a7a2a" roughness={0.9} />
        </mesh>
      )}
      {/* Penthouse extras: outdoor daybed / lounge */}
      {isPenthouse && (
        <>
          <mesh position={[0, 0.18, 0.3]}>
            <boxGeometry args={[2, 0.2, 1.2]} />
            <meshStandardMaterial color="#f5f0e0" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.38, -0.1]}>
            <boxGeometry args={[2, 0.4, 0.15]} />
            <meshStandardMaterial color="#f5f0e0" roughness={0.5} />
          </mesh>
        </>
      )}
    </group>
  );
}

/* ═══════════════════════════════════════════════
   BUILDING — richly detailed wing structure
   ═══════════════════════════════════════════════ */
function WingBuilding({
  wing,
  rooms,
  selectedRoom,
  onSelectRoom,
}: {
  wing: string;
  rooms: AvailabilityRoom[];
  selectedRoom: AvailabilityRoom | null;
  onSelectRoom: (r: AvailabilityRoom) => void;
}) {
  const cfg = WING_CONFIG[wing];
  if (!cfg) return null;

  const floors = 5;
  const rpf = 6; // rooms per floor
  const rW = 3.6;
  const fH = 3.2;
  const bW = rpf * rW + 2;        // building width
  const bD = 10;                    // building depth
  const bH = floors * fH + 2;      // building height
  const halfW = bW / 2;
  const halfD = bD / 2;

  return (
    <group position={cfg.pos} rotation={[0, cfg.rot, 0]}>

      {/* ── FOUNDATION / BASE ── */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[bW + 1, 0.8, bD + 1]} />
        <meshStandardMaterial color="#7a6e5e" roughness={0.85} />
      </mesh>

      {/* ── MAIN BUILDING BODY ── */}
      <mesh position={[0, bH / 2 + 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[bW, bH, bD]} />
        <meshStandardMaterial color={C.building} roughness={0.85} metalness={0.05} />
      </mesh>

      {/* ── ACCENT STRIP along top (wing color) ── */}
      <mesh position={[0, bH + 0.5, halfD + 0.02]}>
        <boxGeometry args={[bW + 0.2, 0.4, 0.06]} />
        <meshStandardMaterial color={cfg.color} emissive={cfg.color} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, bH + 0.5, -(halfD + 0.02)]}>
        <boxGeometry args={[bW + 0.2, 0.4, 0.06]} />
        <meshStandardMaterial color={cfg.color} emissive={cfg.color} emissiveIntensity={0.2} />
      </mesh>

      {/* ── FLOOR SLABS (horizontal bands on facade) ── */}
      {Array.from({ length: floors + 1 }).map((_, f) => (
        <group key={`slab-${f}`}>
          {/* Front */}
          <mesh position={[0, f * fH + 0.8, halfD + 0.03]}>
            <boxGeometry args={[bW + 0.5, 0.2, 0.08]} />
            <meshStandardMaterial color={C.concrete} roughness={0.5} />
          </mesh>
          {/* Back */}
          <mesh position={[0, f * fH + 0.8, -(halfD + 0.03)]}>
            <boxGeometry args={[bW + 0.5, 0.2, 0.08]} />
            <meshStandardMaterial color={C.concrete} roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* ── VERTICAL FACADE COLUMNS (pillars between rooms) ── */}
      {Array.from({ length: rpf + 1 }).map((_, i) => {
        const px = (i - rpf / 2) * rW;
        return (
          <group key={`col-${i}`}>
            <mesh position={[px, bH / 2 + 0.8, halfD + 0.04]} castShadow>
              <boxGeometry args={[0.2, bH, 0.1]} />
              <meshStandardMaterial color="#c5b8a0" roughness={0.6} />
            </mesh>
            <mesh position={[px, bH / 2 + 0.8, -(halfD + 0.04)]}>
              <boxGeometry args={[0.2, bH, 0.1]} />
              <meshStandardMaterial color="#c5b8a0" roughness={0.6} />
            </mesh>
          </group>
        );
      })}

      {/* ── SIDE FACADE WINDOWS (left & right walls) ── */}
      {Array.from({ length: floors }).map((_, f) =>
        Array.from({ length: 2 }).map((_, w) => {
          const sideX = w === 0 ? -(halfW + 0.02) : halfW + 0.02;
          const yy = f * fH + fH / 2 + 1.3;
          return (
            <group key={`sw-${f}-${w}`}>
              {/* Window frame */}
              <mesh position={[sideX, yy, -1.5]}>
                <boxGeometry args={[0.06, 2, 2.2]} />
                <meshStandardMaterial color="#5c4033" roughness={0.7} />
              </mesh>
              <mesh position={[sideX, yy, -1.5]}>
                <boxGeometry args={[0.08, 1.6, 1.8]} />
                <meshStandardMaterial color={C.glass} transparent opacity={0.3} metalness={0.7} roughness={0.05} />
              </mesh>
              <mesh position={[sideX, yy, 1.5]}>
                <boxGeometry args={[0.06, 2, 2.2]} />
                <meshStandardMaterial color="#5c4033" roughness={0.7} />
              </mesh>
              <mesh position={[sideX, yy, 1.5]}>
                <boxGeometry args={[0.08, 1.6, 1.8]} />
                <meshStandardMaterial color={C.glass} transparent opacity={0.3} metalness={0.7} roughness={0.05} />
              </mesh>
            </group>
          );
        })
      )}

      {/* ── ROOF ── */}
      {/* Main roof slab */}
      <mesh position={[0, bH + 1.2, 0]} castShadow>
        <boxGeometry args={[bW + 2, 0.5, bD + 2]} />
        <meshStandardMaterial color={C.roof} roughness={0.7} />
      </mesh>
      {/* Parapet wall */}
      {([
        [0, bH + 1.8, halfD + 0.8, bW + 2, 0.8, 0.15],
        [0, bH + 1.8, -(halfD + 0.8), bW + 2, 0.8, 0.15],
        [-(halfW + 0.8), bH + 1.8, 0, 0.15, 0.8, bD + 1.5],
        [halfW + 0.8, bH + 1.8, 0, 0.15, 0.8, bD + 1.5],
      ] as [number, number, number, number, number, number][]).map(([px, py, pz, w, h, d], i) => (
        <mesh key={`par-${i}`} position={[px, py, pz]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color="#d6cbb8" roughness={0.6} />
        </mesh>
      ))}
      {/* Parapet top cap */}
      <mesh position={[0, bH + 2.25, halfD + 0.8]}>
        <boxGeometry args={[bW + 2.3, 0.1, 0.35]} />
        <meshStandardMaterial color={cfg.color} metalness={0.6} roughness={0.3} />
      </mesh>

      {/* ── ROOFTOP PENTHOUSE STRUCTURE ── */}
      <mesh position={[0, bH + 3, 0]} castShadow>
        <boxGeometry args={[bW * 0.5, 2.5, bD * 0.6]} />
        <meshStandardMaterial color="#e0d8c8" roughness={0.7} />
      </mesh>
      {/* Penthouse glazing */}
      <mesh position={[0, bH + 3, bD * 0.3 + 0.02]}>
        <boxGeometry args={[bW * 0.48, 2, 0.06]} />
        <meshStandardMaterial color={C.glass} transparent opacity={0.4} metalness={0.8} roughness={0.05} />
      </mesh>

      {/* ── ROOFTOP PRIVATE POOL ── */}
      <mesh position={[halfW * 0.55, bH + 1.6, -1]} receiveShadow>
        <boxGeometry args={[5, 0.3, 3]} />
        <meshStandardMaterial color={C.poolEdge} roughness={0.4} />
      </mesh>
      <mesh position={[halfW * 0.55, bH + 1.7, -1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.4, 2.4]} />
        <meshStandardMaterial color={C.poolWater} transparent opacity={0.7} roughness={0.05} metalness={0.3} />
      </mesh>

      {/* ── ROOFTOP LOUNGE PERGOLA ── */}
      <group position={[-(halfW * 0.55), bH + 1.5, -1]}>
        {[[-2, 2], [-2, -1], [2, 2], [2, -1]].map(([px, pz], i) => (
          <mesh key={`pg-${i}`} position={[px, 1.2, pz]}>
            <cylinderGeometry args={[0.08, 0.08, 2.4, 6]} />
            <meshStandardMaterial color={C.wood} roughness={0.7} />
          </mesh>
        ))}
        {/* Top beams */}
        {[-1.2, -0.4, 0.4, 1.2].map((pz, i) => (
          <mesh key={`pb-${i}`} position={[0, 2.4, pz]}>
            <boxGeometry args={[4.5, 0.12, 0.2]} />
            <meshStandardMaterial color={C.wood} roughness={0.7} />
          </mesh>
        ))}
      </group>

      {/* ── ENTRANCE — grand porte-cochère ── */}
      <group position={[0, 0, halfD]}>
        {/* Canopy */}
        <mesh position={[0, 4.2, 2]} castShadow>
          <boxGeometry args={[8, 0.3, 4.5]} />
          <meshStandardMaterial color={C.roof} roughness={0.5} />
        </mesh>
        {/* Canopy gold edge */}
        <mesh position={[0, 4.05, 4.2]}>
          <boxGeometry args={[8.2, 0.08, 0.15]} />
          <meshStandardMaterial color="#c9a84c" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* 4 entrance columns */}
        {[-3, -1, 1, 3].map((x) => (
          <mesh key={`enc-${x}`} position={[x, 2.1, 3.5]} castShadow>
            <cylinderGeometry args={[0.25, 0.35, 4.2, 8]} />
            <meshStandardMaterial color="#f5f0e0" roughness={0.3} />
          </mesh>
        ))}
        {/* Column caps */}
        {[-3, -1, 1, 3].map((x) => (
          <mesh key={`cap-${x}`} position={[x, 4.05, 3.5]}>
            <boxGeometry args={[0.9, 0.15, 0.9]} />
            <meshStandardMaterial color="#e8dbc8" roughness={0.3} />
          </mesh>
        ))}
        {/* Glass revolving door */}
        <mesh position={[0, 1.6, 0.15]}>
          <boxGeometry args={[3.5, 3.2, 0.08]} />
          <meshStandardMaterial color={C.glass} transparent opacity={0.45} metalness={0.7} roughness={0.05} />
        </mesh>
        {/* Door frame */}
        <mesh position={[0, 1.6, 0.12]}>
          <boxGeometry args={[3.8, 3.4, 0.04]} />
          <meshStandardMaterial color="#c9a84c" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Side windows */}
        {[-3, 3].map((x) => (
          <mesh key={`sdw-${x}`} position={[x, 1.5, 0.12]}>
            <boxGeometry args={[2, 2.5, 0.06]} />
            <meshStandardMaterial color={C.glass} transparent opacity={0.35} metalness={0.6} roughness={0.1} />
          </mesh>
        ))}
        {/* Driveway */}
        <mesh position={[0, 0.02, 5]} receiveShadow>
          <boxGeometry args={[10, 0.05, 6]} />
          <meshStandardMaterial color="#9a9080" roughness={0.8} />
        </mesh>
      </group>

      {/* ── AC UNITS on back facade (realistic detail) ── */}
      {Array.from({ length: floors }).map((_, f) =>
        [-(halfW - 2), halfW - 2].map((x, xi) => (
          <mesh key={`ac-${f}-${xi}`} position={[x, f * fH + 2, -(halfD + 0.5)]}>
            <boxGeometry args={[1.2, 0.8, 0.6]} />
            <meshStandardMaterial color="#d0d0d0" roughness={0.6} metalness={0.3} />
          </mesh>
        ))
      )}

      {/* ── BALCONIES on front facade ── */}
      {Array.from({ length: floors }).map((_, f) =>
        Array.from({ length: rpf }).map((_, r) => {
          const lx = (r - (rpf - 1) / 2) * rW;
          const ly = f * fH + fH / 2 + 1.3;
          const isPH = f === floors - 1 && (r === 0 || r === rpf - 1);
          return (
            <Balcony
              key={`bal-${f}-${r}`}
              x={lx}
              y={ly}
              z={halfD}
              isPenthouse={isPH}
            />
          );
        })
      )}

      {/* ── BACK FACADE WINDOWS (decorative) ── */}
      {Array.from({ length: floors }).map((_, f) =>
        Array.from({ length: rpf }).map((_, r) => {
          const lx = (r - (rpf - 1) / 2) * rW;
          const ly = f * fH + fH / 2 + 1.3;
          return (
            <group key={`bwg-${f}-${r}`} position={[lx, ly, -(halfD + 0.02)]}>
              {/* Frame */}
              <mesh>
                <boxGeometry args={[2.8, 2.1, 0.05]} />
                <meshStandardMaterial color="#5c4033" roughness={0.7} />
              </mesh>
              {/* Glass */}
              <mesh position={[0, 0, -0.01]}>
                <planeGeometry args={[2.4, 1.7]} />
                <meshStandardMaterial color={C.glass} transparent opacity={0.25} metalness={0.6} roughness={0.05} />
              </mesh>
            </group>
          );
        })
      )}

      {/* ── INTERACTIVE ROOM WINDOWS (front facade) ── */}
      {rooms.map((room) => {
        const floorIdx = room.floor - 1;
        const sortedOnFloor = rooms
          .filter((r) => r.floor === room.floor)
          .sort((a, b) => a.room_number.localeCompare(b.room_number));
        const idxOnFloor = sortedOnFloor.indexOf(room);
        if (idxOnFloor < 0) return null;
        const lx = (idxOnFloor - (rpf - 1) / 2) * rW;
        const ly = floorIdx * fH + fH / 2 + 1.3;
        const lz = halfD + 0.2;
        return (
          <RoomUnit
            key={room.id}
            room={room}
            localX={lx}
            localY={ly}
            localZ={lz}
            isSelected={selectedRoom?.id === room.id}
            onSelect={onSelectRoom}
          />
        );
      })}

      {/* ── WING LABEL ── */}
      <Text
        position={[0, bH + 5.5, 0]}
        fontSize={2.5}
        color={cfg.color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.08}
        outlineColor="#000000"
      >
        {wing}
      </Text>

      {/* ── GROUND LANDSCAPING around building ── */}
      {[-halfW - 2, halfW + 2].map((x) => (
        <group key={`bld-bush-${x}`}>
          <mesh position={[x, 0.6, halfD + 1]} castShadow>
            <sphereGeometry args={[0.8, 8, 6]} />
            <meshStandardMaterial color="#2d6a2d" roughness={0.9} />
          </mesh>
          <mesh position={[x, 0.5, halfD + 3]} castShadow>
            <sphereGeometry args={[0.6, 8, 6]} />
            <meshStandardMaterial color="#3a8a3a" roughness={0.9} />
          </mesh>
        </group>
      ))}
      {/* Flowerbed at entrance */}
      <mesh position={[0, 0.15, halfD + 6]} receiveShadow>
        <boxGeometry args={[6, 0.3, 1.5]} />
        <meshStandardMaterial color="#3b2a1a" roughness={0.9} />
      </mesh>
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={`fl-${i}`} position={[(i - 2) * 1.2, 0.45, halfD + 6]}>
          <sphereGeometry args={[0.3, 6, 6]} />
          <meshStandardMaterial color={["#e74c3c", "#f39c12", "#e91e63", "#9b59b6", "#e74c3c"][i]} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════
   CENTRAL LOBBY — grand architectural centerpiece
   ═══════════════════════════════════════════════ */
function Lobby() {
  return (
    <group>
      {/* Foundation platform */}
      <mesh position={[0, 0.3, 0]} receiveShadow>
        <cylinderGeometry args={[18, 19, 0.6, 8]} />
        <meshStandardMaterial color="#8a7e6e" roughness={0.8} />
      </mesh>

      {/* Main octagonal structure */}
      <mesh position={[0, 5.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[14, 16, 10, 8]} />
        <meshStandardMaterial color={C.lobby} roughness={0.75} />
      </mesh>

      {/* Upper band (gold accent) */}
      <mesh position={[0, 10.2, 0]}>
        <cylinderGeometry args={[14.2, 14, 0.4, 8]} />
        <meshStandardMaterial color="#c9a84c" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Glass dome */}
      <mesh position={[0, 11.5, 0]}>
        <sphereGeometry args={[10, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={C.glass} transparent opacity={0.2} metalness={0.85} roughness={0.03} side={THREE.DoubleSide} />
      </mesh>

      {/* Dome metal frame rings */}
      {[5, 7, 8.5, 9.5].map((r, i) => (
        <mesh key={`dr-${i}`} position={[0, 11 + i * 0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r, 0.1, 6, 32]} />
          <meshStandardMaterial color="#8B8878" metalness={0.85} roughness={0.2} />
        </mesh>
      ))}

      {/* Dome vertical ribs */}
      {Array.from({ length: 8 }).map((_, i) => (
        <group key={`rib-${i}`} rotation={[0, (i / 8) * Math.PI * 2, 0]}>
          <mesh position={[0, 14, 7]} rotation={[0.35, 0, 0]}>
            <boxGeometry args={[0.1, 8, 0.1]} />
            <meshStandardMaterial color="#8B8878" metalness={0.85} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Grand entrance columns (4 entrances) */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, ai) => (
        <group key={`ent-${ai}`} rotation={[0, angle, 0]}>
          {[-3.5, -1.5, 1.5, 3.5].map((x) => (
            <mesh key={`lc-${x}`} position={[x, 5.5, 17]} castShadow>
              <cylinderGeometry args={[0.4, 0.55, 10, 8]} />
              <meshStandardMaterial color="#f5f0e0" roughness={0.25} />
            </mesh>
          ))}
          {/* Column bases */}
          {[-3.5, -1.5, 1.5, 3.5].map((x) => (
            <mesh key={`lb-${x}`} position={[x, 0.8, 17]}>
              <boxGeometry args={[1.2, 0.4, 1.2]} />
              <meshStandardMaterial color="#d4c5a0" roughness={0.4} />
            </mesh>
          ))}
          {/* Column capitals */}
          {[-3.5, -1.5, 1.5, 3.5].map((x) => (
            <mesh key={`lca-${x}`} position={[x, 10.3, 17]}>
              <boxGeometry args={[1, 0.3, 1]} />
              <meshStandardMaterial color="#d4c5a0" roughness={0.4} />
            </mesh>
          ))}
          {/* Glass facade between columns */}
          <mesh position={[0, 5.5, 16.1]}>
            <boxGeometry args={[9, 8, 0.08]} />
            <meshStandardMaterial color={C.glass} transparent opacity={0.25} metalness={0.7} roughness={0.05} />
          </mesh>
          {/* Glass door */}
          <mesh position={[0, 2.5, 16.2]}>
            <boxGeometry args={[3.5, 4, 0.06]} />
            <meshStandardMaterial color={C.glass} transparent opacity={0.4} metalness={0.6} roughness={0.1} />
          </mesh>
          {/* Gold door frame */}
          <mesh position={[0, 2.5, 16.15]}>
            <boxGeometry args={[3.8, 4.3, 0.03]} />
            <meshStandardMaterial color="#c9a84c" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Central fountain */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[3, 3.5, 0.6, 12]} />
        <meshStandardMaterial color="#d0c8b8" roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.3, 0.5, 1.5, 8]} />
        <meshStandardMaterial color="#d0c8b8" roughness={0.4} />
      </mesh>
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[1.2, 0.3, 0.4, 8]} />
        <meshStandardMaterial color="#d0c8b8" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.8, 16]} />
        <meshStandardMaterial color={C.poolWater} transparent opacity={0.6} roughness={0.05} />
      </mesh>

      {/* Title */}
      <Text position={[0, 17, 0]} fontSize={2.2} color="#c9a84c" anchorX="center" anchorY="middle" outlineWidth={0.08} outlineColor="#000">
        Grand Meridian Resort
      </Text>
    </group>
  );
}

/* ═══════════════════════════════════════════════
   SWIMMING POOL — infinity edge resort pool
   ═══════════════════════════════════════════════ */
function Pool() {
  const waterRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (waterRef.current) waterRef.current.position.y = 0.35 + Math.sin(clock.getElapsedTime() * 0.8) * 0.03;
  });
  return (
    <group position={[0, 0.05, 24]}>
      {/* Pool surround deck */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[28, 0.2, 16]} />
        <meshStandardMaterial color="#d4c5a0" roughness={0.5} />
      </mesh>
      {/* Pool edge walls */}
      <mesh position={[0, 0.3, 0]} receiveShadow>
        <boxGeometry args={[22, 0.6, 12]} />
        <meshStandardMaterial color={C.poolEdge} roughness={0.35} />
      </mesh>
      {/* Inner pool (darker for depth) */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[20.5, 0.1, 10.5]} />
        <meshStandardMaterial color="#1a6e8e" roughness={0.3} />
      </mesh>
      {/* Water surface */}
      <mesh ref={waterRef} position={[0, 0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial color={C.poolWater} transparent opacity={0.7} roughness={0.03} metalness={0.35} />
      </mesh>
      {/* Lane dividers */}
      {[-4, 0, 4].map((x) => (
        <mesh key={`ln-${x}`} position={[x, 0.36, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.05, 10]} />
          <meshStandardMaterial color="#fff" transparent opacity={0.4} />
        </mesh>
      ))}
      {/* Pool steps */}
      {[0, 0.15, 0.3].map((y, i) => (
        <mesh key={`step-${i}`} position={[-9.5 + i * 0.5, y + 0.1, 0]}>
          <boxGeometry args={[1, 0.15, 4]} />
          <meshStandardMaterial color="#d8d0c0" roughness={0.4} />
        </mesh>
      ))}
      {/* Poolside lounge chairs */}
      {[[-12, -3], [-12, 0], [-12, 3], [12, -3], [12, 0], [12, 3]].map(([x, z], i) => (
        <group key={`lch-${i}`} position={[x, 0.2, z]}>
          <mesh position={[0, 0.12, 0]} rotation={[0.1, x < 0 ? 0.3 : -0.3, 0]}>
            <boxGeometry args={[1, 0.1, 2.2]} />
            <meshStandardMaterial color="#f5f0e0" roughness={0.5} />
          </mesh>
          {/* Backrest */}
          <mesh position={[x < 0 ? -0.3 : 0.3, 0.35, -0.8]} rotation={[0.8, 0, 0]}>
            <boxGeometry args={[0.9, 0.08, 0.8]} />
            <meshStandardMaterial color="#f5f0e0" roughness={0.5} />
          </mesh>
        </group>
      ))}
      {/* Pool umbrellas */}
      {[[-12, -4.5], [-12, 4.5], [12, -4.5], [12, 4.5]].map(([x, z], i) => (
        <group key={`pu-${i}`} position={[x, 0, z]}>
          <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 3, 6]} />
            <meshStandardMaterial color={C.wood} />
          </mesh>
          <mesh position={[0, 2.9, 0]}>
            <coneGeometry args={[1.8, 0.8, 8]} />
            <meshStandardMaterial color="#f5f0e0" roughness={0.6} />
          </mesh>
        </group>
      ))}
      <Text position={[0, 2, -8]} fontSize={1.2} color="#0ea5e9" anchorX="center">
        Infinity Pool
      </Text>
    </group>
  );
}

/* ═══════════════════════════════════════════════
   PALM TREE — detailed tropical palm
   ═══════════════════════════════════════════════ */
function PalmTree({ position, height = 8 }: { position: [number, number, number]; height?: number }) {
  return (
    <group position={position}>
      {/* Trunk — slightly curved */}
      <mesh position={[0.2, height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.45, height, 8]} />
        <meshStandardMaterial color={C.trunk} roughness={0.95} />
      </mesh>
      {/* Trunk bark rings */}
      {Array.from({ length: Math.floor(height / 1.2) }).map((_, i) => (
        <mesh key={i} position={[0.2, 1.5 + i * 1.2, 0]}>
          <torusGeometry args={[0.32, 0.05, 6, 12]} />
          <meshStandardMaterial color="#4a2e14" roughness={0.95} />
        </mesh>
      ))}
      {/* Coconut cluster */}
      {[[0.35, height - 0.2, 0.2], [-0.15, height - 0.3, -0.3], [0.1, height - 0.1, -0.15]].map(([x, y, z], i) => (
        <mesh key={`co-${i}`} position={[x, y, z]}>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshStandardMaterial color="#5c3a1e" roughness={0.85} />
        </mesh>
      ))}
      {/* Fronds — drooping leaves */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const tilt = 0.6 + (i % 3) * 0.15;
        const len = 4 + (i % 2) * 1.5;
        return (
          <group key={`fr-${i}`} position={[0.2, height, 0]} rotation={[tilt, angle, 0]}>
            {/* Main leaf spine */}
            <mesh position={[0, 0, len / 2]} castShadow>
              <boxGeometry args={[0.08, 0.03, len]} />
              <meshStandardMaterial color="#1a5c1a" roughness={0.8} />
            </mesh>
            {/* Leaf surface */}
            <mesh position={[0, -0.02, len / 2]} castShadow>
              <boxGeometry args={[0.7, 0.02, len]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? C.leaves : C.leavesDark}
                roughness={0.85}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Leaf tip (drooping) */}
            <mesh position={[0, -0.3, len + 0.5]} rotation={[0.4, 0, 0]} castShadow>
              <boxGeometry args={[0.4, 0.02, 1.2]} />
              <meshStandardMaterial color={C.leavesDark} roughness={0.85} side={THREE.DoubleSide} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ═══════════════════════════════════════════════
   PATHWAYS
   ═══════════════════════════════════════════════ */
function Pathways() {
  return (
    <group>
      {([
        [[-22, 0.06, 0], [20, 0.12, 4]],
        [[22, 0.06, 0], [20, 0.12, 4]],
        [[0, 0.06, -22], [4, 0.12, 20]],
        [[0, 0.06, 22], [4, 0.12, 20]],
      ] as [[number, number, number], [number, number, number]][]).map(([p, s], i) => (
        <mesh key={`pw-${i}`} position={p} receiveShadow>
          <boxGeometry args={s} />
          <meshStandardMaterial color={C.path} roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[17, 20, 32]} />
        <meshStandardMaterial color={C.path} roughness={0.7} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════
   OCEAN + BEACH
   ═══════════════════════════════════════════════ */
function Ocean() {
  const waterRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (waterRef.current) waterRef.current.position.y = -0.3 + Math.sin(clock.getElapsedTime() * 0.5) * 0.15;
  });
  return (
    <group>
      {/* Beach */}
      <mesh position={[0, -0.1, 82]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 30]} />
        <meshStandardMaterial color={C.sand} roughness={0.95} />
      </mesh>
      {/* Deep water */}
      <mesh ref={waterRef} position={[0, -0.3, 120]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[300, 100]} />
        <meshStandardMaterial color={C.water} transparent opacity={0.8} roughness={0.05} metalness={0.4} />
      </mesh>
      {/* Shallow water */}
      <mesh position={[0, -0.2, 97]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[200, 10]} />
        <meshStandardMaterial color={C.waterShallow} transparent opacity={0.6} roughness={0.1} />
      </mesh>
      {/* Beach umbrellas + lounge chairs */}
      {[[-15, 80], [-5, 82], [5, 81], [15, 80], [25, 82], [-25, 81]].map(([x, z], i) => (
        <group key={`ub-${i}`} position={[x, 0, z]}>
          <mesh position={[0, 2, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 4, 6]} />
            <meshStandardMaterial color={C.wood} />
          </mesh>
          <mesh position={[0, 3.8, 0]}>
            <coneGeometry args={[2, 1, 8]} />
            <meshStandardMaterial color={["#e74c3c", "#f5f0e0", "#2980b9"][i % 3]} roughness={0.7} />
          </mesh>
          <mesh position={[1.5, 0.3, 0]} rotation={[0.15, 0.3, 0]}>
            <boxGeometry args={[1.2, 0.15, 2.5]} />
            <meshStandardMaterial color="#f5f0e0" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════
   MAIN SCENE
   ═══════════════════════════════════════════════ */
function ResortScene({
  rooms,
  selectedRoom,
  onSelectRoom,
}: {
  rooms: AvailabilityRoom[];
  selectedRoom: AvailabilityRoom | null;
  onSelectRoom: (room: AvailabilityRoom) => void;
}) {
  const wingRooms = useMemo(() => {
    const map: Record<string, AvailabilityRoom[]> = {};
    rooms.forEach((r) => {
      const w = r.wing || "Unknown";
      if (!map[w]) map[w] = [];
      map[w].push(r);
    });
    return map;
  }, [rooms]);

  const treePositions: [number, number, number, number][] = useMemo(
    () => [
      [-30, 0, 18, 9], [-25, 0, 25, 7], [-18, 0, 15, 10], [18, 0, 15, 8], [25, 0, 25, 11], [30, 0, 18, 7],
      [-30, 0, -18, 8], [-22, 0, -25, 10], [22, 0, -25, 9], [30, 0, -18, 7],
      [-58, 0, 20, 10], [-62, 0, -18, 8], [58, 0, 20, 9], [62, 0, -18, 11],
      [10, 0, 65, 8], [-10, 0, 68, 10], [20, 0, 70, 7], [-20, 0, 72, 9],
      [-35, 0, 72, 11], [35, 0, 72, 8], [0, 0, 75, 10],
      [-45, 0, 12, 7], [45, 0, 12, 9], [-45, 0, -12, 8], [45, 0, -12, 10],
      [-15, 0, 40, 9], [15, 0, 40, 7], [0, 0, -55, 8],
    ],
    []
  );

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[60, 80, 40]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={200}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
      <directionalLight position={[-40, 30, -40]} intensity={0.3} color="#ffd4a0" />
      <pointLight position={[0, 20, 0]} intensity={0.5} color="#ffeaa7" distance={50} />

      {/* Sky */}
      <Sky sunPosition={[100, 40, 60]} turbidity={3} rayleigh={0.5} />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color={C.ground} roughness={0.95} />
      </mesh>

      <Ocean />
      <Pathways />
      <Pool />
      <Lobby />

      {/* Wing buildings */}
      {Object.entries(wingRooms).map(([wing, wRooms]) => (
        <WingBuilding
          key={wing}
          wing={wing}
          rooms={wRooms}
          selectedRoom={selectedRoom}
          onSelectRoom={onSelectRoom}
        />
      ))}

      {/* Trees */}
      {treePositions.map(([x, y, z, h], i) => (
        <PalmTree key={`t-${i}`} position={[x, y, z]} height={h} />
      ))}

      {/* Bushes */}
      {([
        [-18, 0.8, 10], [18, 0.8, 10], [-18, 0.8, -10], [18, 0.8, -10],
        [-25, 0.8, 5], [25, 0.8, 5], [-12, 0.8, 32], [12, 0.8, 32],
      ] as [number, number, number][]).map((pos, i) => (
        <mesh key={`bush-${i}`} position={pos} castShadow>
          <sphereGeometry args={[0.7 + (i % 3) * 0.3, 8, 6]} />
          <meshStandardMaterial color="#2d6a2d" roughness={0.9} />
        </mesh>
      ))}

      {/* Controls */}
      <OrbitControls
        makeDefault
        maxPolarAngle={Math.PI / 2.15}
        minPolarAngle={0.2}
        minDistance={25}
        maxDistance={160}
        target={[0, 8, 10]}
        enableDamping
        dampingFactor={0.05}
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
        { color: C.available, label: "Available" },
        { color: C.occupied, label: "Occupied" },
        { color: C.selected, label: "Selected" },
      ].map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-xs text-[var(--foreground)]">{item.label}</span>
        </div>
      ))}
      <hr className="border-black/10" />
      <p className="text-[10px] text-[var(--muted)]">Scroll to zoom &middot; Drag to rotate</p>
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

  // When a room is selected, store it in localStorage for chat pickup
  useEffect(() => {
    if (selected) {
      localStorage.setItem("selected_room", JSON.stringify({
        id: selected.id,
        roomName: selected.room_name,
        wing: selected.wing,
        floor: selected.floor,
        number: selected.room_number,
        type: selected.type,
        available: selected.available,
      }));
    }
  }, [selected]);

  const handleBook = useCallback(
    (room: AvailabilityRoom) => {
      if (onBookRoom) onBookRoom(room);
      // Also store in localStorage for chat
      localStorage.setItem("selected_room", JSON.stringify({
        id: room.id,
        roomName: room.room_name,
        wing: room.wing,
        floor: room.floor,
        number: room.room_number,
        type: room.type,
        available: room.available,
      }));
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
        camera={{ position: [80, 55, 90], fov: 45 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
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
