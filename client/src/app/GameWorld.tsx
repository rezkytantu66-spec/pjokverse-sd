"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, Sky, Environment } from "@react-three/drei";
import * as THREE from "three";
import { io, Socket } from "socket.io-client";
import pjokData from "./data/pjokData.json";
import { AVATAR_35_LIST, AvatarPreset } from "./page";

const ARENA_TILES = [
  { id: 0, label: "A", color: "#ef4444", pos: [-4.2, 0, 13.8] as [number, number, number] },
  { id: 1, label: "B", color: "#3b82f6", pos: [4.2, 0, 13.8] as [number, number, number] },
  { id: 2, label: "C", color: "#eab308", pos: [-4.2, 0, 22.2] as [number, number, number] },
  { id: 3, label: "D", color: "#22c55e", pos: [4.2, 0, 22.2] as [number, number, number] },
];

const BUILDING_COLORS = [
  "#f97316",
  "#8b5cf6",
  "#0ea5e9",
  "#10b981",
  "#ec4899",
  "#eab308",
];

function getStandingTileLabel(pos?: [number, number, number]) {
  if (!pos) return null;
  for (const tile of ARENA_TILES) {
    if (Math.abs(pos[0] - tile.pos[0]) < 3.9 && Math.abs(pos[2] - tile.pos[2]) < 3.9) {
      return tile;
    }
  }
  return null;
}

function CheerfulBGM({ muted }: { muted: boolean }) {
  useEffect(() => {
    if (muted) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const melody = [
      523.25, 659.25, 783.99, 659.25, 880.0, 783.99, 659.25, 587.33,
      523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 659.25,
    ];
    let step = 0;

    const interval = setInterval(() => {
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(melody[step % melody.length], ctx.currentTime);

      gain.gain.setValueAtTime(0.025, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
      step++;
    }, 360);

    return () => {
      clearInterval(interval);
      ctx.close();
    };
  }, [muted]);

  return null;
}

function VoxelCharacter({
  shirtColor,
  pantsColor = "#1e293b",
  skinColor = "#fcd34d",
  headStyle = "boy",
  isMoving,
  isCoach = false,
}: {
  shirtColor: string;
  pantsColor?: string;
  skinColor?: string;
  headStyle?: string;
  isMoving: boolean;
  isCoach?: boolean;
}) {
  const leftLeg = useRef<THREE.Mesh>(null);
  const rightLeg = useRef<THREE.Mesh>(null);
  const leftArm = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * 10;
    const swing = isMoving ? Math.sin(t) * 0.6 : 0;

    if (leftLeg.current) leftLeg.current.rotation.x = swing;
    if (rightLeg.current) rightLeg.current.rotation.x = -swing;
    if (leftArm.current) leftArm.current.rotation.x = -swing;
    if (rightArm.current) rightArm.current.rotation.x = swing;
  });

  return (
    <group>
      {/* Kaki */}
      <mesh ref={leftLeg} position={[-0.25, 0.45, 0]} castShadow>
        <boxGeometry args={[0.38, 0.9, 0.42]} />
        <meshStandardMaterial color={pantsColor} />
      </mesh>
      <mesh ref={rightLeg} position={[0.25, 0.45, 0]} castShadow>
        <boxGeometry args={[0.38, 0.9, 0.42]} />
        <meshStandardMaterial color={pantsColor} />
      </mesh>

      {/* Badan */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <boxGeometry args={[0.95, 1.05, 0.55]} />
        <meshStandardMaterial color={shirtColor} />
      </mesh>

      {/* Peluit Emas Khusus Coach */}
      {isCoach && (
        <mesh position={[0, 1.65, 0.3]} castShadow>
          <boxGeometry args={[0.22, 0.25, 0.15]} />
          <meshStandardMaterial color="#facc15" metalness={0.6} roughness={0.2} />
        </mesh>
      )}

      {/* Tangan */}
      <mesh ref={leftArm} position={[-0.68, 1.4, 0]} castShadow>
        <boxGeometry args={[0.32, 0.95, 0.38]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      <mesh ref={rightArm} position={[0.68, 1.4, 0]} castShadow>
        <boxGeometry args={[0.32, 0.95, 0.38]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>

      {/* Kepala */}
      <mesh position={[0, 2.38, 0]} castShadow>
        <boxGeometry args={[0.85, 0.85, 0.85]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>

      {/* Mata */}
      <mesh position={[-0.2, 2.42, 0.44]}>
        <boxGeometry args={[0.12, 0.12, 0.05]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0.2, 2.42, 0.44]}>
        <boxGeometry args={[0.12, 0.12, 0.05]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      {/* Variasi 7 Gaya Kepala / Aksesori untuk 35 Avatar */}
      {!isCoach && headStyle === "boy" && (
        <mesh position={[0, 2.83, -0.02]} castShadow>
          <boxGeometry args={[0.88, 0.22, 0.88]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      )}

      {!isCoach && headStyle === "girl" && (
        <group>
          <mesh position={[0, 2.83, -0.02]} castShadow>
            <boxGeometry args={[0.88, 0.24, 0.88]} />
            <meshStandardMaterial color="#451a03" />
          </mesh>
          <mesh position={[0, 2.55, -0.55]} castShadow>
            <boxGeometry args={[0.35, 0.55, 0.3]} />
            <meshStandardMaterial color="#451a03" />
          </mesh>
        </group>
      )}

      {!isCoach && headStyle === "hijab" && (
        <group>
          <mesh position={[0, 2.42, -0.06]} castShadow>
            <boxGeometry args={[0.94, 0.94, 0.86]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
          <mesh position={[0, 1.92, 0]} castShadow>
            <boxGeometry args={[0.98, 0.25, 0.65]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
        </group>
      )}

      {!isCoach && headStyle === "cap" && (
        <group position={[0, 2.84, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.9, 0.22, 0.9]} />
            <meshStandardMaterial color={shirtColor} />
          </mesh>
          <mesh position={[0, -0.05, 0.35]} castShadow>
            <boxGeometry args={[0.86, 0.08, 0.45]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
        </group>
      )}

      {!isCoach && headStyle === "bandana" && (
        <group>
          <mesh position={[0, 2.83, -0.02]} castShadow>
            <boxGeometry args={[0.88, 0.22, 0.88]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0, 2.66, 0]}>
            <boxGeometry args={[0.9, 0.14, 0.9]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
      )}

      {!isCoach && headStyle === "glasses" && (
        <group>
          <mesh position={[0, 2.83, -0.02]} castShadow>
            <boxGeometry args={[0.88, 0.22, 0.88]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0, 2.42, 0.45]}>
            <boxGeometry args={[0.78, 0.18, 0.06]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
        </group>
      )}

      {!isCoach && headStyle === "crown" && (
        <group>
          <mesh position={[0, 2.83, -0.02]} castShadow>
            <boxGeometry args={[0.88, 0.2, 0.88]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0, 3.05, 0]} castShadow>
            <cylinderGeometry args={[0.32, 0.36, 0.26, 8]} />
            <meshStandardMaterial color="#facc15" metalness={0.7} roughness={0.2} />
          </mesh>
        </group>
      )}

      {isCoach && (
        <group position={[0, 2.85, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.9, 0.25, 0.9]} />
            <meshStandardMaterial color="#1e3a8a" />
          </mesh>
          <mesh position={[0, -0.05, 0.35]} castShadow>
            <boxGeometry args={[0.88, 0.1, 0.5]} />
            <meshStandardMaterial color="#1d4ed8" />
          </mesh>
        </group>
      )}
    </group>
  );
}

function RemotePlayer({ data, isHighlighted = false }: { data: any; isHighlighted?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const preset = AVATAR_35_LIST.find((a) => a.id === data.avatarType);

  useFrame((_, delta) => {
    if (!groupRef.current || !data.pos) return;
    groupRef.current.position.lerp(
      new THREE.Vector3(data.pos[0], data.pos[1], data.pos[2]),
      delta * 12
    );
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      data.rotY || 0,
      delta * 12
    );
  });

  return (
    <group ref={groupRef} position={data.pos || [0, 0, 5]}>
      <VoxelCharacter
        shirtColor={preset?.shirtColor || data.color || "#3b82f6"}
        pantsColor={preset?.pantsColor || "#1e293b"}
        skinColor={preset?.skinColor || "#fcd34d"}
        headStyle={preset?.headStyle || "boy"}
        isMoving={data.isMoving || false}
      />
      {isHighlighted && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
          <ringGeometry args={[0.9, 1.35, 32]} />
          <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.7} />
        </mesh>
      )}
      <Text
        position={[0, 3.25, 0]}
        fontSize={isHighlighted ? 0.55 : 0.4}
        color={isHighlighted ? "#facc15" : "#38bdf8"}
        outlineWidth={0.05}
        outlineColor="black"
      >
        {data.name || "Teman"}
      </Text>
    </group>
  );
}

function ArenaFloorTile({
  tile,
  isFallen,
}: {
  tile: (typeof ARENA_TILES)[0];
  isFallen: boolean;
}) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const targetY = isFallen ? -12 : 0.15;
    meshRef.current.position.y = THREE.MathUtils.lerp(
      meshRef.current.position.y,
      targetY,
      delta * 5
    );
  });

  return (
    <group ref={meshRef} position={[tile.pos[0], 0.15, tile.pos[2]]}>
      <mesh receiveShadow castShadow>
        <boxGeometry args={[7.8, 0.3, 7.8]} />
        <meshStandardMaterial color={tile.color} />
      </mesh>
      <Text
        position={[0, 0.18, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={2.8}
        color="white"
        outlineWidth={0.12}
        outlineColor="black"
      >
        {tile.label}
      </Text>
    </group>
  );
}

function SpectatorCameraController({
  preset,
  followedPlayer,
}: {
  preset: "overview" | "arena";
  followedPlayer: any | null;
}) {
  const targetFocus = useRef(new THREE.Vector3(0, 1, 2));
  const manualOffset = useRef(new THREE.Vector3(0, 0, 0));
  const zoomOffset = useRef(0);
  const keys = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const down = (e: KeyboardEvent) => (keys.current[e.key.toLowerCase()] = true);
    const up = (e: KeyboardEvent) => (keys.current[e.key.toLowerCase()] = false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    manualOffset.current.set(0, 0, 0);
  }, [preset, followedPlayer?.id]);

  useFrame((state, delta) => {
    const moveSpeed = 16 * delta;
    if (keys.current["w"] || keys.current["arrowup"]) manualOffset.current.z -= moveSpeed;
    if (keys.current["s"] || keys.current["arrowdown"]) manualOffset.current.z += moveSpeed;
    if (keys.current["a"] || keys.current["arrowleft"]) manualOffset.current.x -= moveSpeed;
    if (keys.current["d"] || keys.current["arrowright"]) manualOffset.current.x += moveSpeed;
    if (keys.current["q"]) zoomOffset.current = Math.max(zoomOffset.current - moveSpeed, -10);
    if (keys.current["e"]) zoomOffset.current = Math.min(zoomOffset.current + moveSpeed, 18);

    let desiredFocus = new THREE.Vector3(0, 1, 2);
    let desiredCamPos = new THREE.Vector3(0, 22, 28);

    if (followedPlayer && followedPlayer.pos) {
      const [px, py, pz] = followedPlayer.pos;
      desiredFocus.set(px, Math.max(py, 0) + 1.5, pz);
      desiredCamPos.set(px, Math.max(py, 0) + 10 + zoomOffset.current * 0.5, pz + 16 + zoomOffset.current * 0.6);
    } else if (preset === "arena") {
      desiredFocus.set(0, 1, 18);
      desiredCamPos.set(0, 17 + zoomOffset.current * 0.6, 33 + zoomOffset.current * 0.7);
    } else {
      desiredFocus.set(0, 1, 3);
      desiredCamPos.set(0, 24 + zoomOffset.current * 0.6, 30 + zoomOffset.current * 0.7);
    }

    desiredFocus.add(manualOffset.current);
    desiredCamPos.add(manualOffset.current);

    state.camera.position.lerp(desiredCamPos, 0.08);
    targetFocus.current.lerp(desiredFocus, 0.1);
    state.camera.lookAt(targetFocus.current);
  });

  return null;
}

function Player({
  playerName,
  avatarPreset,
  socketRef,
  joyVector,
  jumpTrigger,
  teleportTrigger,
  onInteractBuilding,
  onNearCoach,
  onNearPortal,
  onStandingTileChange,
  gedungList,
  isTileFallen,
  isMiniGame,
}: any) {
  const groupRef = useRef<THREE.Group>(null);
  const keys = useRef<{ [key: string]: boolean }>({});
  const velocityY = useRef(0);
  const isGrounded = useRef(true);
  const [moving, setMoving] = useState(false);
  const lastEmitTime = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
      if (e.code === "Space" && isGrounded.current) {
        velocityY.current = 9;
        isGrounded.current = false;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => (keys.current[e.key.toLowerCase()] = false);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (jumpTrigger > 0 && isGrounded.current) {
      velocityY.current = 9;
      isGrounded.current = false;
    }
  }, [jumpTrigger]);

  useEffect(() => {
    if (teleportTrigger && groupRef.current) {
      groupRef.current.position.set(
        teleportTrigger.pos[0],
        teleportTrigger.pos[1],
        teleportTrigger.pos[2]
      );
      velocityY.current = 0;
      isGrounded.current = true;
    }
  }, [teleportTrigger]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const speed = 10;

    let moveX = joyVector.x;
    let moveZ = joyVector.y;

    if (keys.current["w"] || keys.current["arrowup"]) moveZ -= 1;
    if (keys.current["s"] || keys.current["arrowdown"]) moveZ += 1;
    if (keys.current["a"] || keys.current["arrowleft"]) moveX -= 1;
    if (keys.current["d"] || keys.current["arrowright"]) moveX += 1;

    const length = Math.hypot(moveX, moveZ);
    const isCurrentlyMoving = length > 0.05;
    if (isCurrentlyMoving !== moving) setMoving(isCurrentlyMoving);

    if (isCurrentlyMoving) {
      const normX = moveX / Math.max(length, 1);
      const normZ = moveZ / Math.max(length, 1);

      groupRef.current.position.x += normX * speed * delta;
      groupRef.current.position.z += normZ * speed * delta;

      const targetAngle = Math.atan2(normX, normZ);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetAngle,
        0.2
      );
    }

    const pos = groupRef.current.position;

    let currentTileId: number | null = null;
    for (const tile of ARENA_TILES) {
      if (Math.abs(pos.x - tile.pos[0]) < 3.9 && Math.abs(pos.z - tile.pos[2]) < 3.9) {
        currentTileId = tile.id;
        break;
      }
    }
    onStandingTileChange(currentTileId);

    const standingOnFallenTile = currentTileId !== null && isTileFallen(currentTileId);
    const groundHeight = standingOnFallenTile ? -6 : currentTileId !== null ? 0.3 : 0;

    if (!isGrounded.current || pos.y > groundHeight) {
      pos.y += velocityY.current * delta;
      velocityY.current -= 24 * delta;

      if (pos.y <= groundHeight) {
        pos.y = groundHeight;
        velocityY.current = 0;
        isGrounded.current = true;
      }
    } else if (pos.y < groundHeight) {
      pos.y = groundHeight;
    }

    pos.x = THREE.MathUtils.clamp(pos.x, -42, 42);
    pos.z = THREE.MathUtils.clamp(pos.z, -42, 42);

    const now = state.clock.getElapsedTime();
    if (socketRef.current && socketRef.current.connected && now - lastEmitTime.current > 0.05) {
      lastEmitTime.current = now;
      socketRef.current.emit("movePlayer", {
        pos: [pos.x, pos.y, pos.z],
        rotY: groupRef.current.rotation.y,
        isMoving: isCurrentlyMoving,
      });
    }

    const camHeight = isMiniGame ? 13.5 : 10;
    const camDist = isMiniGame ? 19.5 : 16;
    state.camera.position.lerp(
      new THREE.Vector3(pos.x, Math.max(pos.y, 0) + camHeight, pos.z + camDist),
      0.1
    );
    state.camera.lookAt(pos.x, Math.max(pos.y, 0) + 1.5, pos.z);

    const distCoach = new THREE.Vector2(pos.x, pos.z).distanceTo(new THREE.Vector2(0, -4));
    onNearCoach(distCoach < 3.8);

    const distPortal = new THREE.Vector2(pos.x, pos.z).distanceTo(new THREE.Vector2(14, -4));
    onNearPortal(distPortal < 3.8);

    let foundBuilding = null;
    for (const gedung of gedungList) {
      const distB = new THREE.Vector2(pos.x, pos.z).distanceTo(
        new THREE.Vector2(gedung.posisi_3d[0], gedung.posisi_3d[2])
      );
      if (distB < 4.5) {
        foundBuilding = gedung;
        break;
      }
    }
    onInteractBuilding(foundBuilding);
  });

  return (
    <group ref={groupRef} position={[0, 0, 5]}>
      <VoxelCharacter
        shirtColor={avatarPreset.shirtColor}
        pantsColor={avatarPreset.pantsColor}
        skinColor={avatarPreset.skinColor}
        headStyle={avatarPreset.headStyle}
        isMoving={moving}
      />
      <Text
        position={[0, 3.25, 0]}
        fontSize={0.4}
        color="white"
        outlineWidth={0.05}
        outlineColor="black"
      >
        {playerName}
      </Text>
    </group>
  );
}

function SportsEnvironment({ faseId }: { faseId: string }) {
  const treePositions: [number, number, number][] = [
    [-28, 0, -28],
    [28, 0, -28],
    [-30, 0, 10],
    [30, 0, 10],
    [-25, 0, 32],
    [25, 0, 32],
  ];

  const groundColor =
    faseId === "fase-a"
      ? "#86efac"
      : faseId === "fase-b"
      ? "#22c55e"
      : "#16a34a";

  const trackColor =
    faseId === "fase-a"
      ? "#facc15"
      : faseId === "fase-b"
      ? "#dc2626"
      : "#0284c7";

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color={groundColor} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -4]} receiveShadow>
        <ringGeometry args={[21, 25, 48]} />
        <meshStandardMaterial color={trackColor} />
      </mesh>

      {faseId === "fase-a" && (
        <group>
          {[-8, -4, 0, 4, 8].map((xPos, i) => (
            <mesh key={i} position={[xPos, 0.45, -18]} castShadow>
              <coneGeometry args={[0.45, 0.9, 16]} />
              <meshStandardMaterial color={i % 2 === 0 ? "#f97316" : "#ec4899"} />
            </mesh>
          ))}
          <mesh position={[-7, 0.2, 2]} castShadow>
            <boxGeometry args={[0.8, 0.4, 7]} />
            <meshStandardMaterial color="#f59e0b" />
          </mesh>
          <mesh position={[0, 0.1, -24]} rotation={[0, 0, 0]}>
            <torusGeometry args={[2.5, 0.35, 16, 32, Math.PI]} />
            <meshStandardMaterial color="#3b82f6" />
          </mesh>
        </group>
      )}

      {faseId === "fase-b" && (
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -10]}>
            <planeGeometry args={[18, 0.25]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <group position={[0, 0, -26]}>
            <mesh position={[-3.2, 1.3, 0]} castShadow>
              <boxGeometry args={[0.25, 2.6, 0.25]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[3.2, 1.3, 0]} castShadow>
              <boxGeometry args={[0.25, 2.6, 0.25]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0, 2.6, 0]} castShadow>
              <boxGeometry args={[6.65, 0.25, 0.25]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          </group>
          <group position={[0, 0, -33]}>
            <mesh position={[0, 0.6, 0]} castShadow>
              <boxGeometry args={[24, 1.2, 2.5]} />
              <meshStandardMaterial color="#dc2626" />
            </mesh>
            <mesh position={[0, 1.6, -1.5]} castShadow>
              <boxGeometry args={[24, 2.2, 2.5]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
          </group>
        </group>
      )}

      {faseId === "fase-c" && (
        <group>
          <group position={[0, 0, -25]}>
            <mesh position={[-2.2, 0.6, 0]} castShadow>
              <boxGeometry args={[2, 1.2, 2]} />
              <meshStandardMaterial color="#cbd5e1" />
            </mesh>
            <Text position={[-2.2, 1.4, 0]} fontSize={0.5} color="#0f172a">
              2
            </Text>
            <mesh position={[0, 0.9, 0]} castShadow>
              <boxGeometry args={[2.2, 1.8, 2.2]} />
              <meshStandardMaterial color="#facc15" />
            </mesh>
            <Text position={[0, 2.0, 0]} fontSize={0.6} color="#0f172a">
              1
            </Text>
            <mesh position={[2.2, 0.4, 0]} castShadow>
              <boxGeometry args={[2, 0.8, 2]} />
              <meshStandardMaterial color="#d97706" />
            </mesh>
            <Text position={[2.2, 1.0, 0]} fontSize={0.5} color="#0f172a">
              3
            </Text>
          </group>

          <group position={[-10, 0, -25]}>
            <mesh position={[0, 2.5, 0]} castShadow>
              <cylinderGeometry args={[0.5, 0.9, 5, 16]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.5} />
            </mesh>
            <mesh position={[0, 5.4, 0]}>
              <coneGeometry args={[0.7, 1.4, 16]} />
              <meshStandardMaterial color="#f97316" emissive="#ea580c" emissiveIntensity={0.8} />
            </mesh>
          </group>

          <group position={[10, 0, -25]}>
            <mesh position={[0, 2.2, 0]} castShadow>
              <boxGeometry args={[0.3, 4.4, 0.3]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh position={[0, 3.8, 0.3]} castShadow>
              <boxGeometry args={[2.2, 1.4, 0.15]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0, 3.4, 0.8]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.45, 0.06, 12, 24]} />
              <meshStandardMaterial color="#ea580c" />
            </mesh>
          </group>
        </group>
      )}

      <group position={[14, 0, -4]}>
        <mesh position={[-1.6, 2, 0]} castShadow>
          <boxGeometry args={[0.4, 4, 0.4]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.5} />
        </mesh>
        <mesh position={[1.6, 2, 0]} castShadow>
          <boxGeometry args={[0.4, 4, 0.4]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.5} />
        </mesh>
        <mesh position={[0, 4, 0]} castShadow>
          <boxGeometry args={[3.6, 0.5, 0.5]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.5} />
        </mesh>
        <mesh position={[0, 2, 0]}>
          <planeGeometry args={[2.8, 3.6]} />
          <meshStandardMaterial color="#fef08a" transparent opacity={0.65} side={THREE.DoubleSide} />
        </mesh>
        <Text position={[0, 4.9, 0]} fontSize={0.55} color="#fde047" outlineWidth={0.07} outlineColor="black">
          🏆 Arena Jatuh Bangun
        </Text>
      </group>

      <mesh position={[0, 0.05, 18]} receiveShadow>
        <boxGeometry args={[17.6, 0.1, 17.6]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {treePositions.map((pos, idx) => (
        <group key={idx} position={pos}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <boxGeometry args={[0.9, 3, 0.9]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>
          <mesh position={[0, 3.8, 0]} castShadow>
            <boxGeometry args={[3.2, 2.6, 3.2]} />
            <meshStandardMaterial color={faseId === "fase-a" ? "#22c55e" : "#15803d"} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function VirtualJoystick({ onMove }: { onMove: (vec: { x: number; y: number }) => void }) {
  const baseRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!baseRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxRadius = rect.width / 2 - 16;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setKnobPos({ x: dx, y: dy });
    onMove({ x: dx / maxRadius, y: dy / maxRadius });
  };

  const resetJoystick = () => {
    setDragging(false);
    setKnobPos({ x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
  };

  return (
    <div
      ref={baseRef}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
        updateJoystick(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (dragging) updateJoystick(e.clientX, e.clientY);
      }}
      onPointerUp={resetJoystick}
      onPointerCancel={resetJoystick}
      className="w-28 h-28 rounded-full bg-slate-900/50 border-2 border-white/40 backdrop-blur-sm flex items-center justify-center touch-none cursor-pointer"
    >
      <div
        style={{ transform: `translate(${knobPos.x}px, ${knobPos.y}px)` }}
        className="w-12 h-12 rounded-full bg-yellow-400/90 border-2 border-white shadow-lg pointer-events-none"
      />
    </div>
  );
}

export default function GameWorld({
  faseData,
  playerName,
  avatarPreset,
  isSpectator = false,
  isMuted = false,
  onBack,
}: {
  faseData: any;
  playerName: string;
  avatarPreset: AvatarPreset;
  isSpectator?: boolean;
  isMuted?: boolean;
  onBack: () => void;
}) {
  const socketRef = useRef<Socket | null>(null);
  const [otherPlayers, setOtherPlayers] = useState<{ [id: string]: any }>({});
  const [onlineCount, setOnlineCount] = useState(isSpectator ? 0 : 1);

  const [cameraPreset, setCameraPreset] = useState<"overview" | "arena">("overview");
  const [followedPlayerId, setFollowedPlayerId] = useState<string | null>(null);

  const [joyVector, setJoyVector] = useState({ x: 0, y: 0 });
  const [jumpTrigger, setJumpTrigger] = useState(0);
  const [teleportTrigger, setTeleportTrigger] = useState<{ pos: [number, number, number]; id: number } | null>(null);
  const [nearCoach, setNearCoach] = useState(false);
  const [nearPortal, setNearPortal] = useState(false);
  const [activeBuilding, setActiveBuilding] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const [standingTile, setStandingTile] = useState<number | null>(null);
  const [miniGameActive, setMiniGameActive] = useState(false);
  const [mgIndex, setMgIndex] = useState(0);
  const [mgTimeLeft, setMgTimeLeft] = useState(8);
  const [mgPhase, setMgPhase] = useState<"running" | "dropped">("running");
  const [mgStatusText, setMgStatusText] = useState("");

  useEffect(() => {
    const serverHost = typeof window !== "undefined" ? window.location.hostname : "localhost";
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || `http://${serverHost}:4000`;
    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.on("connect", () => {
      if (!isSpectator) {
        socket.emit("joinGame", {
          name: playerName,
          faseId: faseData.id,
          color: avatarPreset.shirtColor,
          avatarType: avatarPreset.id,
        });
      }
    });

    socket.on("updatePlayers", (allPlayers: { [id: string]: any }) => {
      const filtered: { [id: string]: any } = {};
      let count = 0;
      Object.entries(allPlayers).forEach(([id, p]) => {
        if (p.faseId === faseData.id) {
          count++;
          if (id !== socket.id) {
            filtered[id] = p;
          }
        }
      });

      setOtherPlayers(filtered);
      setOnlineCount(isSpectator ? count : Math.max(count, 1));
    });

    socket.on("playerMoved", (movedPlayer: any) => {
      if (movedPlayer.faseId === faseData.id && movedPlayer.id !== socket.id) {
        setOtherPlayers((prev) => ({
          ...prev,
          [movedPlayer.id]: movedPlayer,
        }));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [faseData.id, playerName, avatarPreset, isSpectator]);

  const studentList = useMemo(() => Object.values(otherPlayers), [otherPlayers]);
  const followedPlayer = followedPlayerId ? otherPlayers[followedPlayerId] || null : null;

  const allMiniGameQuestions = useMemo(() => {
    const list: any[] = [];
    faseData.gedung_materi.forEach((g: any) => {
      g.kuis.forEach((k: any) => list.push(k));
    });
    return list;
  }, [faseData]);

  const currentMgQuestion = allMiniGameQuestions[mgIndex % allMiniGameQuestions.length];

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "id-ID";
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startMiniGame = () => {
    setMiniGameActive(true);
    setMgIndex(0);
    setMgTimeLeft(8);
    setMgPhase("running");
    setMgStatusText("Lari ke ubin jawaban!");
    setTeleportTrigger({ pos: [0, 0.5, 18], id: Date.now() });
    speakText(allMiniGameQuestions[0].pertanyaan);
  };

  const stopMiniGame = () => {
    setMiniGameActive(false);
    setMgPhase("running");
    setTeleportTrigger({ pos: [0, 0, 5], id: Date.now() });
  };

  useEffect(() => {
    if (!miniGameActive || isSpectator) return;

    const timer = setInterval(() => {
      setMgTimeLeft((prev) => {
        if (prev > 1) return prev - 1;

        if (mgPhase === "running") {
          setMgPhase("dropped");
          const correctId = currentMgQuestion.jawaban_benar;
          if (standingTile === correctId) {
            setScore((s) => s + 200);
            setMgStatusText(`🎉 BENAR (${ARENA_TILES[correctId].label}) +200 XP`);
          } else {
            setMgStatusText(`💥 Salah! Jawaban: ${ARENA_TILES[correctId].label}`);
          }
          return 4;
        } else {
          const nextIdx = mgIndex + 1;
          setMgIndex(nextIdx);
          setMgPhase("running");
          setMgStatusText("Lari ke ubin jawaban!");
          setTeleportTrigger({ pos: [0, 0.5, 18], id: Date.now() });
          speakText(allMiniGameQuestions[nextIdx % allMiniGameQuestions.length].pertanyaan);
          return 8;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [miniGameActive, mgPhase, mgIndex, standingTile, currentMgQuestion, allMiniGameQuestions, isSpectator]);

  const isTileFallen = (tileId: number) => {
    if (!miniGameActive || mgPhase !== "dropped") return false;
    return tileId !== currentMgQuestion.jawaban_benar;
  };

  const handleAnswer = (idx: number) => {
    const currentQuiz = activeBuilding.kuis[quizIndex];
    if (idx === currentQuiz.jawaban_benar) {
      setFeedback(`✅ ${currentQuiz.pembahasan}`);
      setScore((s) => s + 100);
    } else {
      setFeedback(`❌ Kurang tepat. ${currentQuiz.pembahasan}`);
    }
  };

  const nextQuestion = () => {
    setFeedback(null);
    if (quizIndex + 1 < activeBuilding.kuis.length) {
      setQuizIndex(quizIndex + 1);
    } else {
      setShowModal(false);
      setQuizIndex(0);
    }
  };

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden select-none">
      <CheerfulBGM muted={isMuted} />

      {/* HUD Atas Ramping untuk Mode Portrait & Desktop */}
      <div
        style={{
          paddingTop: "max(0.5rem, env(safe-area-inset-top))",
          paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
          paddingRight: "max(0.75rem, env(safe-area-inset-right))",
        }}
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between pointer-events-none gap-2"
      >
        <div className="flex items-center gap-1.5 bg-slate-900/90 text-white px-2.5 py-1.5 rounded-xl border border-slate-700 shadow pointer-events-auto">
          <button
            onClick={onBack}
            className="bg-red-600 hover:bg-red-500 px-2.5 py-1 rounded-lg text-xs font-extrabold"
          >
            ← Fase
          </button>
          <span className="text-xs font-bold text-yellow-400 truncate max-w-[110px] sm:max-w-none">
            {faseData.nama_fase}
          </span>
        </div>

        {!isSpectator ? (
          <div className="flex items-center gap-2 bg-slate-900/90 text-white px-3 py-1.5 rounded-xl border border-slate-700 shadow pointer-events-auto text-xs">
            <span className="text-emerald-400 font-extrabold">{score} XP</span>
            <span className="text-sky-400 font-bold">👥 {onlineCount}</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 text-white p-1.5 rounded-xl border border-slate-700 shadow-lg pointer-events-auto">
            <span className="bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
              🖥️ Pemantau Guru
            </span>
            <button
              onClick={() => {
                setFollowedPlayerId(null);
                setCameraPreset("overview");
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                !followedPlayerId && cameraPreset === "overview"
                  ? "bg-yellow-400 text-slate-950"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200"
              }`}
            >
              🗺️ Lapangan
            </button>
            <button
              onClick={() => {
                setFollowedPlayerId(null);
                setCameraPreset("arena");
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                !followedPlayerId && cameraPreset === "arena"
                  ? "bg-yellow-400 text-slate-950"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200"
              }`}
            >
              🏆 Arena 4 Warna
            </button>
          </div>
        )}
      </div>

      {/* Daftar Siswa Layar Pemantau Guru */}
      {isSpectator && (
        <div className="absolute top-16 right-3 z-10 w-60 max-h-[75vh] overflow-y-auto bg-slate-900/90 backdrop-blur-md text-white p-3.5 rounded-2xl border border-slate-700 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2.5">
            <span className="text-xs font-extrabold text-yellow-400 uppercase tracking-wide">
              📋 Daftar Siswa ({studentList.length})
            </span>
            {followedPlayer && (
              <button
                onClick={() => setFollowedPlayerId(null)}
                className="text-[11px] bg-slate-700 hover:bg-slate-600 px-2 py-0.5 rounded font-bold"
              >
                Lepas Fokus
              </button>
            )}
          </div>

          {studentList.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">
              Menunggu siswa masuk ke {faseData.nama_fase}...
            </p>
          ) : (
            <div className="space-y-1.5">
              {studentList.map((student: any) => {
                const tileOn = getStandingTileLabel(student.pos);
                const isFocused = followedPlayerId === student.id;
                return (
                  <button
                    key={student.id}
                    onClick={() => setFollowedPlayerId(isFocused ? null : student.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition border ${
                      isFocused
                        ? "bg-yellow-400/20 border-yellow-400 text-white"
                        : "bg-slate-800/90 hover:bg-slate-800 border-slate-700 text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        style={{ backgroundColor: student.color || "#3b82f6" }}
                        className="w-3 h-3 rounded-full shrink-0 border border-white"
                      />
                      <span className="font-bold truncate">{student.name || "Siswa"}</span>
                    </div>
                    {tileOn ? (
                      <span
                        style={{ backgroundColor: tileOn.color }}
                        className="px-2 py-0.5 rounded text-[10px] font-extrabold text-white shrink-0"
                      >
                        Ubin {tileOn.label}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {student.isMoving ? "🏃 Berlari" : "🧍 Diam"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Panel Soal Mini-Game: Jawaban Utuh Tidak Terpotong */}
      {!isSpectator && miniGameActive && currentMgQuestion && (
        <div
          style={{ top: "max(3.1rem, calc(env(safe-area-inset-top) + 2.7rem))" }}
          className="fixed left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-xl bg-slate-950/80 backdrop-blur-sm text-white px-3 py-2.5 rounded-2xl border border-yellow-400/90 shadow-lg pointer-events-auto"
        >
          <div className="flex justify-between items-center gap-2 mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="bg-yellow-400 text-slate-950 text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                ⏱️ {mgTimeLeft}d
              </span>
              <span className="bg-slate-800/90 text-sky-300 text-[11px] font-bold px-2 py-0.5 rounded-full border border-slate-600">
                {standingTile !== null
                  ? `📍 Ubin ${ARENA_TILES[standingTile].label}`
                  : "📍 Di Tengah"}
              </span>
            </div>
            <span className="text-[11px] font-bold text-emerald-300">
              {mgStatusText}
            </span>
            <button
              onClick={stopMiniGame}
              className="bg-red-600 hover:bg-red-500 text-[11px] px-2 py-0.5 rounded font-bold shrink-0"
            >
              Keluar
            </button>
          </div>

          <p className="font-bold text-xs md:text-sm mb-2 text-center leading-snug">
            {currentMgQuestion.pertanyaan}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] md:text-xs font-bold">
            {currentMgQuestion.pilihan.map((opsi: string, i: number) => (
              <div
                key={i}
                style={{ backgroundColor: ARENA_TILES[i]?.color || "#334155" }}
                className={`px-2.5 py-1.5 rounded-lg text-white shadow flex items-start gap-1.5 leading-snug ${
                  standingTile === i ? "ring-2 ring-white scale-[1.01]" : "opacity-95"
                }`}
              >
                <span className="bg-black/40 px-1.5 py-0.5 rounded font-extrabold shrink-0">
                  {ARENA_TILES[i]?.label}
                </span>
                <span className="break-words">{opsi}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kontrol Layar Sentuh Mode Portrait (Tanpa Mikrofon) */}
      {!isSpectator && !showModal && (
        <>
          <div
            style={{
              bottom: "max(1.5rem, env(safe-area-inset-bottom))",
              left: "max(1.25rem, env(safe-area-inset-left))",
            }}
            className="absolute z-10"
          >
            <VirtualJoystick onMove={setJoyVector} />
          </div>

          <div
            style={{
              bottom: "max(1.75rem, env(safe-area-inset-bottom))",
              right: "max(1.25rem, env(safe-area-inset-right))",
            }}
            className="absolute z-10"
          >
            <button
              onPointerDown={() => setJumpTrigger((n) => n + 1)}
              className="w-20 h-20 rounded-full bg-emerald-500/90 active:bg-emerald-400 border-4 border-white text-slate-950 font-extrabold text-sm shadow-xl touch-none"
            >
              LOMPAT
            </button>
          </div>
        </>
      )}

      {!isSpectator && nearPortal && !miniGameActive && !showModal && (
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-10 w-[85%] max-w-xs text-center">
          <button
            onClick={startMiniGame}
            className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold px-4 py-3 rounded-full shadow-2xl border-2 border-white animate-bounce text-xs md:text-sm"
          >
            🏆 Mulai Lomba Jatuh Bangun!
          </button>
        </div>
      )}

      {!isSpectator && nearCoach && !miniGameActive && !showModal && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 w-[92%] max-w-lg bg-slate-900/95 text-white p-3.5 rounded-2xl border-2 border-yellow-400 shadow-2xl">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-yellow-400 text-sm md:text-base">🧢 {pjokData.npc_utama.nama}</span>
            <button
              onClick={() => speakText(pjokData.npc_utama.dialog_awal)}
              className="bg-blue-600 hover:bg-blue-500 text-xs px-3 py-1 rounded-full font-semibold"
            >
              🔊 Suara Coach
            </button>
          </div>
          <p className="text-xs md:text-sm leading-relaxed">{pjokData.npc_utama.dialog_awal}</p>
          <p className="text-xs text-emerald-400 mt-1 font-medium">
            👉 Dekati gedung materi atau masuk ke Portal Emas di kanan untuk lomba Jatuh Bangun!
          </p>
        </div>
      )}

      {!isSpectator && activeBuilding && !miniGameActive && !showModal && (
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-10 w-[85%] max-w-xs text-center">
          <button
            onClick={() => {
              setShowModal(true);
              setQuizIndex(0);
              setFeedback(null);
            }}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-extrabold px-4 py-3 rounded-full shadow-2xl border-2 border-white animate-bounce text-xs md:text-sm"
          >
            🚪 Masuk: {activeBuilding.nama_gedung}
          </button>
        </div>
      )}

      {!isSpectator && showModal && activeBuilding && (
        <div className="absolute inset-0 z-20 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 max-w-2xl w-full rounded-2xl p-5 shadow-2xl max-h-[88dvh] overflow-y-auto">
            <div className="flex justify-between items-start border-b pb-3 mb-3">
              <div>
                <h2 className="text-lg md:text-xl font-extrabold text-blue-700">{activeBuilding.nama_gedung}</h2>
                <p className="text-xs md:text-sm font-semibold text-slate-500">{activeBuilding.topik}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-600 font-bold text-xl">
                ✕
              </button>
            </div>

            <div className="bg-blue-50 p-3.5 rounded-xl mb-4 border border-blue-200">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-bold text-blue-900 text-sm">📖 Ringkasan Materi</span>
                <button
                  onClick={() => speakText(activeBuilding.ringkasan_materi)}
                  className="bg-blue-600 text-white text-xs px-3 py-1 rounded-lg font-semibold hover:bg-blue-500"
                >
                  🔊 Bacakan Materi
                </button>
              </div>
              <p className="text-xs md:text-sm text-slate-700 leading-relaxed">{activeBuilding.ringkasan_materi}</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-emerald-600 mb-1">
                Kuis PJOK ({quizIndex + 1} dari {activeBuilding.kuis.length})
              </p>
              <h3 className="font-bold text-sm md:text-base mb-2.5">{activeBuilding.kuis[quizIndex].pertanyaan}</h3>
              <div className="grid grid-cols-1 gap-2">
                {activeBuilding.kuis[quizIndex].pilihan.map((opsi: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={feedback !== null}
                    className="text-left px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-amber-50 hover:border-amber-400 font-medium text-xs md:text-sm transition"
                  >
                    {String.fromCharCode(65 + i)}. {opsi}
                  </button>
                ))}
              </div>

              {feedback && (
                <div className="mt-3 p-3 rounded-xl bg-slate-100 border border-slate-300 flex justify-between items-center gap-3">
                  <p className="text-xs md:text-sm font-semibold">{feedback}</p>
                  <button
                    onClick={nextQuestion}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold shrink-0"
                  >
                    {quizIndex + 1 < activeBuilding.kuis.length ? "Soal Berikutnya →" : "Selesai"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Canvas shadows camera={{ position: [0, 10, 16], fov: 50 }}>
        <Sky sunPosition={[100, 30, 100]} />
        <ambientLight intensity={0.65} />
        <directionalLight position={[15, 25, 15]} intensity={1.2} castShadow />
        <Environment preset="park" />

        <SportsEnvironment faseId={faseData.id} />

        {ARENA_TILES.map((tile) => (
          <ArenaFloorTile key={tile.id} tile={tile} isFallen={isTileFallen(tile.id)} />
        ))}

        {isSpectator ? (
          <SpectatorCameraController
            preset={cameraPreset}
            followedPlayer={followedPlayer}
          />
        ) : (
          <Player
            playerName={playerName}
            avatarPreset={avatarPreset}
            socketRef={socketRef}
            joyVector={joyVector}
            jumpTrigger={jumpTrigger}
            teleportTrigger={teleportTrigger}
            onInteractBuilding={setActiveBuilding}
            onNearCoach={setNearCoach}
            onNearPortal={setNearPortal}
            onStandingTileChange={setStandingTile}
            gedungList={faseData.gedung_materi}
            isTileFallen={isTileFallen}
            isMiniGame={miniGameActive}
          />
        )}

        {Object.values(otherPlayers).map((p: any) => (
          <RemotePlayer
            key={p.id}
            data={p}
            isHighlighted={isSpectator && followedPlayerId === p.id}
          />
        ))}

        <group position={[0, 0, -4]}>
          <VoxelCharacter shirtColor="#2563eb" pantsColor="#0f172a" isMoving={false} isCoach={true} />
          <Text position={[0, 3.45, 0]} fontSize={0.45} color="#facc15" outlineWidth={0.06} outlineColor="black">
            {nearCoach ? "💬 Coach Resky" : "❗ Coach Resky"}
          </Text>
        </group>

        {faseData.gedung_materi.map((gedung: any, index: number) => (
          <group key={gedung.id} position={gedung.posisi_3d}>
            <mesh position={[0, 2.5, 0]} castShadow>
              <boxGeometry args={[5.5, 5, 5.5]} />
              <meshStandardMaterial color={BUILDING_COLORS[index % BUILDING_COLORS.length]} />
            </mesh>
            <mesh position={[0, 5.3, 0]} castShadow>
              <boxGeometry args={[6.1, 0.6, 6.1]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh position={[0, 1.3, 2.8]}>
              <boxGeometry args={[1.6, 2.6, 0.2]} />
              <meshStandardMaterial color="#facc15" />
            </mesh>
            <Text position={[0, 6.3, 0]} fontSize={0.55} color="white" outlineWidth={0.07} outlineColor="black">
              {gedung.nama_gedung}
            </Text>
          </group>
        ))}
      </Canvas>
    </div>
  );
}