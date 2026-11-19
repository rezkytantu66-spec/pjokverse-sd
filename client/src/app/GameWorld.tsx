"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, Sky, Environment } from "@react-three/drei";
import * as THREE from "three";
import { io, Socket } from "socket.io-client";
import pjokData from "./data/pjokData.json";

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

      gain.gain.setValueAtTime(0.03, ctx.currentTime);
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
  pantsColor,
  skinColor = "#fcd34d",
  avatarType = "boy",
  isMoving,
  isCoach = false,
}: {
  shirtColor: string;
  pantsColor: string;
  skinColor?: string;
  avatarType?: string;
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
      <mesh ref={leftLeg} position={[-0.25, 0.45, 0]} castShadow>
        <boxGeometry args={[0.38, 0.9, 0.42]} />
        <meshStandardMaterial color={pantsColor} />
      </mesh>
      <mesh ref={rightLeg} position={[0.25, 0.45, 0]} castShadow>
        <boxGeometry args={[0.38, 0.9, 0.42]} />
        <meshStandardMaterial color={pantsColor} />
      </mesh>
      <mesh position={[0, 1.4, 0]} castShadow>
        <boxGeometry args={[0.95, 1.05, 0.55]} />
        <meshStandardMaterial color={shirtColor} />
      </mesh>
      {isCoach && (
        <mesh position={[0, 1.65, 0.3]} castShadow>
          <boxGeometry args={[0.22, 0.25, 0.15]} />
          <meshStandardMaterial color="#facc15" metalness={0.6} roughness={0.2} />
        </mesh>
      )}
      <mesh ref={leftArm} position={[-0.68, 1.4, 0]} castShadow>
        <boxGeometry args={[0.32, 0.95, 0.38]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      <mesh ref={rightArm} position={[0.68, 1.4, 0]} castShadow>
        <boxGeometry args={[0.32, 0.95, 0.38]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      <mesh position={[0, 2.38, 0]} castShadow>
        <boxGeometry args={[0.85, 0.85, 0.85]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      <mesh position={[-0.2, 2.42, 0.44]}>
        <boxGeometry args={[0.12, 0.12, 0.05]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0.2, 2.42, 0.44]}>
        <boxGeometry args={[0.12, 0.12, 0.05]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      {!isCoach && avatarType === "boy" && (
        <mesh position={[0, 2.83, -0.02]} castShadow>
          <boxGeometry args={[0.88, 0.22, 0.88]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      )}

      {!isCoach && avatarType === "girl" && (
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

      {!isCoach && avatarType === "hijab" && (
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

      {!isCoach && avatarType === "cap" && (
        <group position={[0, 2.84, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.9, 0.22, 0.9]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
          <mesh position={[0, -0.05, 0.35]} castShadow>
            <boxGeometry args={[0.86, 0.08, 0.45]} />
            <meshStandardMaterial color="#dc2626" />
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
        shirtColor={data.color || "#3b82f6"}
        pantsColor="#1e293b"
        avatarType={data.avatarType || "boy"}
        isMoving={data.isMoving || false}
      />
      {(isHighlighted || data.isTalking) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
          <ringGeometry args={[0.9, 1.35, 32]} />
          <meshStandardMaterial
            color={data.isTalking ? "#22c55e" : "#facc15"}
            emissive={data.isTalking ? "#22c55e" : "#facc15"}
            emissiveIntensity={0.7}
          />
        </mesh>
      )}
      <Text
        position={[0, 3.25, 0]}
        fontSize={isHighlighted ? 0.55 : 0.4}
        color={data.isTalking ? "#4ade80" : isHighlighted ? "#facc15" : "#38bdf8"}
        outlineWidth={0.05}
        outlineColor="black"
      >
        {`${data.isTalking ? "🔊 " : ""}${data.name || "Teman"}`}
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
  shirtColor,
  avatarType,
  isTalking,
  localPosRef,
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
    if (localPosRef) {
      localPosRef.current = [pos.x, pos.y, pos.z];
    }

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

    state.camera.position.lerp(
      new THREE.Vector3(pos.x, Math.max(pos.y, 0) + 9, pos.z + 15),
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
        shirtColor={shirtColor}
        pantsColor="#1e293b"
        avatarType={avatarType}
        isMoving={moving}
      />
      {isTalking && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
          <ringGeometry args={[0.9, 1.35, 32]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.8} />
        </mesh>
      )}
      <Text
        position={[0, 3.25, 0]}
        fontSize={0.4}
        color={isTalking ? "#4ade80" : "white"}
        outlineWidth={0.05}
        outlineColor="black"
      >
        {`${isTalking ? "🎙️ " : ""}${playerName}`}
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
  shirtColor,
  avatarType = "boy",
  isSpectator = false,
  onBack,
}: any) {
  const socketRef = useRef<Socket | null>(null);
  const localPosRef = useRef<[number, number, number]>([0, 0, 5]);
  const [otherPlayers, setOtherPlayers] = useState<{ [id: string]: any }>({});
  const otherPlayersRef = useRef<{ [id: string]: any }>({});
  const [onlineCount, setOnlineCount] = useState(isSpectator ? 0 : 1);
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // State Layar Penuh untuk Android & iPhone
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [showIOSFullscreenGuide, setShowIOSFullscreenGuide] = useState(false);

  // Voice Chat
  const [isTalking, setIsTalking] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<{ [peerId: string]: RTCPeerConnection }>({});
  const audioElsRef = useRef<{ [peerId: string]: HTMLAudioElement }>({});

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
    otherPlayersRef.current = otherPlayers;
  }, [otherPlayers]);

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOSDevice(ios);

    const isStandalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone) setIsFullscreen(true);

    const handleFsChange = () => {
      const fsEl =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement;
      setIsFullscreen(Boolean(fsEl) || isStandalone);
    };

    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
    };
  }, []);

  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth < 950;
      const isPortrait = window.innerHeight > window.innerWidth;
      setIsPortraitMobile(!isSpectator && isMobile && isPortrait);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, [isSpectator]);

  const toggleMobileFullscreen = async () => {
    const docEl = document.documentElement as any;
    const doc = document as any;

    const fsElement =
      doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement;

    if (fsElement) {
      try {
        if (doc.exitFullscreen) await doc.exitFullscreen();
        else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
      } catch {}
      return;
    }

    const requestFs =
      docEl.requestFullscreen ||
      docEl.webkitRequestFullscreen ||
      docEl.msRequestFullscreen;

    if (requestFs && !isIOSDevice) {
      try {
        await requestFs.call(docEl);
        const orientation = (window.screen as any)?.orientation;
        if (orientation && orientation.lock) {
          await orientation.lock("landscape");
        }
        return;
      } catch {}
    }

    // Jika di iPhone Safari (tidak mendukung Fullscreen API standar)
    window.scrollTo(0, 1);
    setShowIOSFullscreenGuide(true);
  };

  useEffect(() => {
    if (isSpectator) return;
    const interval = setInterval(() => {
      const [lx, , lz] = localPosRef.current;
      Object.entries(audioElsRef.current).forEach(([peerId, audioEl]) => {
        const peerPlayer = otherPlayersRef.current[peerId];
        if (!peerPlayer || !peerPlayer.pos) {
          audioEl.volume = 0.5;
          return;
        }
        const dist = Math.hypot(lx - peerPlayer.pos[0], lz - peerPlayer.pos[2]);
        const maxDist = 14;
        const vol = Math.max(0, Math.min(1, 1 - dist / maxDist));
        audioEl.volume = vol;
      });
    }, 250);

    return () => clearInterval(interval);
  }, [isSpectator]);

  const createPeerConnection = (peerId: string, initiator: boolean) => {
    if (peersRef.current[peerId]) return peersRef.current[peerId];

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    peersRef.current[peerId] = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pc.onicecandidate = (e) => {
      if (e.candidate && socketRef.current) {
        socketRef.current.emit("voice-signal", {
          to: peerId,
          signal: { candidate: e.candidate },
        });
      }
    };

    pc.ontrack = (e) => {
      let audio = audioElsRef.current[peerId];
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        audioElsRef.current[peerId] = audio;
      }
      audio.srcObject = e.streams[0];
      audio.play().catch(() => {});
    };

    if (initiator) {
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          socketRef.current?.emit("voice-signal", {
            to: peerId,
            signal: { sdp: pc.localDescription },
          });
        })
        .catch(() => {});
    }

    return pc;
  };

  const ensureMicrophone = async () => {
    if (localStreamRef.current) return true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getAudioTracks().forEach((t) => (t.enabled = false));
      localStreamRef.current = stream;
      setMicReady(true);
      setMicError(null);

      Object.keys(otherPlayersRef.current).forEach((peerId) => {
        const pc = peersRef.current[peerId];
        if (pc) {
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));
          pc.createOffer()
            .then((offer) => pc.setLocalDescription(offer))
            .then(() => {
              socketRef.current?.emit("voice-signal", {
                to: peerId,
                signal: { sdp: pc.localDescription },
              });
            })
            .catch(() => {});
        } else {
          createPeerConnection(peerId, true);
        }
      });

      return true;
    } catch {
      setMicError("Izin mikrofon ditolak browser HP.");
      return false;
    }
  };

  const startTalking = async () => {
    const ok = await ensureMicrophone();
    if (!ok || !localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = true));
    setIsTalking(true);
    socketRef.current?.emit("talkingState", true);
  };

  const stopTalking = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = false));
    }
    setIsTalking(false);
    socketRef.current?.emit("talkingState", false);
  };

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
          color: shirtColor,
          avatarType,
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
            if (!isSpectator && !peersRef.current[id]) {
              createPeerConnection(id, true);
            }
          }
        }
      });

      Object.keys(peersRef.current).forEach((peerId) => {
        if (!filtered[peerId]) {
          peersRef.current[peerId].close();
          delete peersRef.current[peerId];
          delete audioElsRef.current[peerId];
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

    socket.on("playerTalking", ({ id, isTalking: talking }: { id: string; isTalking: boolean }) => {
      setOtherPlayers((prev) => {
        if (!prev[id]) return prev;
        return {
          ...prev,
          [id]: { ...prev[id], isTalking: talking },
        };
      });
    });

    socket.on("voice-signal", async ({ from, signal }: { from: string; signal: any }) => {
      if (isSpectator) return;
      const pc = createPeerConnection(from, false);
      try {
        if (signal.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          if (signal.sdp.type === "offer") {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("voice-signal", {
              to: from,
              signal: { sdp: pc.localDescription },
            });
          }
        } else if (signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch {}
    });

    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};
      socket.disconnect();
    };
  }, [faseData.id, playerName, shirtColor, avatarType, isSpectator]);

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
    setMgStatusText("Lari ke atas ubin warna jawaban yang benar!");
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
            setMgStatusText(`🎉 BENAR! Jawaban ${ARENA_TILES[correctId].label}. (+200 XP)`);
          } else {
            setMgStatusText(
              `💥 YAH! Jawaban yang benar adalah ${ARENA_TILES[correctId].label}.`
            );
          }
          return 4;
        } else {
          const nextIdx = mgIndex + 1;
          setMgIndex(nextIdx);
          setMgPhase("running");
          setMgStatusText("Lari ke atas ubin warna jawaban yang benar!");
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

      {/* Peringatan Putar HP ke Landscape */}
      {isPortraitMobile && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 text-white flex flex-col items-center justify-center p-6 text-center backdrop-blur-md">
          <div className="text-5xl mb-4 animate-bounce">📱🔄</div>
          <h2 className="text-xl font-extrabold text-yellow-400 mb-2">
            Putar HP ke Mode Landscape
          </h2>
          <p className="text-sm text-slate-300 max-w-xs mb-5 leading-relaxed">
            Miringkan layar HP kamu ke posisi mendatar agar arena permainan dan tombol kontrol terlihat luas.
          </p>
          <button
            onClick={toggleMobileFullscreen}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-5 py-2.5 rounded-full text-sm shadow-lg"
          >
            Aktifkan Layar Penuh Landscape
          </button>
        </div>
      )}

      {/* Panduan Layar Penuh Khusus iPhone Safari */}
      {showIOSFullscreenGuide && (
        <div className="fixed inset-0 z-50 bg-black/80 text-white flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border-2 border-yellow-400 rounded-2xl p-5 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-extrabold text-yellow-400 text-base">
                📱 Layar Penuh di iPhone (Safari)
              </h3>
              <button
                onClick={() => setShowIOSFullscreenGuide(false)}
                className="text-slate-400 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              Safari di iPhone mengunci mode layar penuh lewat menu browser. Pilih salah satu cara cepat berikut:
            </p>
            <div className="space-y-2.5 text-xs bg-slate-800/90 p-3.5 rounded-xl border border-slate-700">
              <p>
                <b className="text-emerald-400">Cara 1 (Instan 1 Detik):</b> Ketuk ikon{" "}
                <b className="bg-slate-700 px-1.5 py-0.5 rounded">☰ / AA</b> di sebelah kiri kolom alamat atas Safari → pilih{" "}
                <b>Sembunyikan Bar Alat</b> (<i>Hide Toolbar</i>).
              </p>
              <p>
                <b className="text-sky-400">Cara 2 (Layar Penuh Total):</b> Ketuk ikon{" "}
                <b className="bg-slate-700 px-1.5 py-0.5 rounded">Bagikan (Kotak Panah Atas)</b> → pilih{" "}
                <b>Tambah ke Layar Utama</b> (<i>Add to Home Screen</i>), lalu buka ikon <b>PJOKVerse SD</b> dari layar utama iPhone.
              </p>
            </div>
            <button
              onClick={() => setShowIOSFullscreenGuide(false)}
              className="mt-4 w-full bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-extrabold py-2 rounded-xl text-xs"
            >
              Mengerti, Kembali ke Permainan
            </button>
          </div>
        </div>
      )}

      {/* HUD Atas dengan Safe-Area iPhone & Android */}
      <div
        style={{
          paddingTop: "max(0.5rem, env(safe-area-inset-top))",
          paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
          paddingRight: "max(0.75rem, env(safe-area-inset-right))",
        }}
        className="absolute top-0 left-0 right-0 z-10 flex items-start justify-between pointer-events-none gap-2"
      >
        <div className="flex flex-wrap items-center gap-1.5 md:gap-2.5 bg-slate-900/90 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-2xl border border-slate-700 shadow-lg pointer-events-auto">
          <button
            onClick={onBack}
            className="bg-red-600 hover:bg-red-500 px-2.5 py-1 md:px-3 md:py-1.5 rounded-xl text-[11px] md:text-xs font-bold"
          >
            ← Ganti Fase
          </button>
          <button
            onClick={() => setIsMuted((m) => !m)}
            className="bg-slate-800 hover:bg-slate-700 px-2.5 py-1 md:px-3 md:py-1.5 rounded-xl text-[11px] md:text-xs font-bold border border-slate-600"
          >
            {isMuted ? "🔇 Musik" : "🎵 Musik"}
          </button>
          <button
            onClick={toggleMobileFullscreen}
            className="bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1 md:px-3 md:py-1.5 rounded-xl text-[11px] md:text-xs font-bold border border-indigo-400"
          >
            {isFullscreen ? "🗗 Keluar Penuh" : "⛶ Layar Penuh"}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-yellow-400 text-xs md:text-base">{faseData.nama_dunia}</p>
              {isSpectator && (
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                  🖥️ Pemantau Guru
                </span>
              )}
            </div>
            <p className="text-[10px] md:text-xs text-slate-300">
              {faseData.nama_fase} •{" "}
              {!isSpectator && (
                <>
                  <span className="text-emerald-400 font-bold">{score} XP</span> •{" "}
                </>
              )}
              <span className="text-sky-400 font-bold">👥 {onlineCount} Aktif</span>
            </p>
          </div>
        </div>

        {isSpectator && (
          <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 text-white p-2 rounded-2xl border border-slate-700 shadow-lg pointer-events-auto">
            <button
              onClick={() => {
                setFollowedPlayerId(null);
                setCameraPreset("overview");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                !followedPlayerId && cameraPreset === "overview"
                  ? "bg-yellow-400 text-slate-950"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200"
              }`}
            >
              🗺️ Seluruh Lapangan
            </button>
            <button
              onClick={() => {
                setFollowedPlayerId(null);
                setCameraPreset("arena");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
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
        <div className="absolute top-20 right-4 z-10 w-64 max-h-[75vh] overflow-y-auto bg-slate-900/90 backdrop-blur-md text-white p-3.5 rounded-2xl border border-slate-700 shadow-2xl">
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
                      <span className="font-bold truncate">
                        {student.isTalking ? "🔊 " : ""}
                        {student.name || "Siswa"}
                      </span>
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

      {/* Panel Soal Mini-Game */}
      {!isSpectator && miniGameActive && currentMgQuestion && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-2xl bg-slate-950/95 text-white p-3 md:p-4 rounded-2xl border-2 border-yellow-400 shadow-2xl">
          <div className="flex justify-between items-center mb-1.5">
            <span className="bg-yellow-400 text-slate-950 text-xs font-extrabold px-3 py-0.5 rounded-full">
              ⏱️ {mgTimeLeft} Detik
            </span>
            <span className="text-xs font-bold text-emerald-400">{mgStatusText}</span>
            <button
              onClick={stopMiniGame}
              className="bg-red-600 hover:bg-red-500 text-xs px-2.5 py-1 rounded-lg font-bold"
            >
              Keluar
            </button>
          </div>
          <p className="font-bold text-xs md:text-base mb-2 text-center">
            {currentMgQuestion.pertanyaan}
          </p>
          <div className="grid grid-cols-2 gap-1.5 text-xs font-bold">
            {currentMgQuestion.pilihan.map((opsi: string, i: number) => (
              <div
                key={i}
                style={{ backgroundColor: ARENA_TILES[i]?.color || "#334155" }}
                className="px-2.5 py-1.5 rounded-xl text-white shadow flex items-center gap-2"
              >
                <span className="bg-black/40 px-1.5 py-0.5 rounded font-extrabold">
                  {ARENA_TILES[i]?.label}
                </span>
                <span className="truncate">{opsi}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kontrol Layar Sentuh dengan Safe-Area iPhone & Android */}
      {!isSpectator && !showModal && (
        <>
          <div
            style={{
              bottom: "max(1.25rem, env(safe-area-inset-bottom))",
              left: "max(1.5rem, env(safe-area-inset-left))",
            }}
            className="absolute z-10"
          >
            <VirtualJoystick onMove={setJoyVector} />
          </div>

          <div
            style={{
              bottom: "max(1.5rem, env(safe-area-inset-bottom))",
              right: "max(1.5rem, env(safe-area-inset-right))",
            }}
            className="absolute z-10 flex flex-col items-end gap-2.5"
          >
            {micError && (
              <span className="bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow">
                {micError}
              </span>
            )}
            <button
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                startTalking();
              }}
              onPointerUp={stopTalking}
              onPointerCancel={stopTalking}
              className={`px-3.5 py-2 rounded-full font-extrabold text-xs shadow-xl border-2 border-white touch-none transition ${
                isTalking
                  ? "bg-red-500 text-white scale-105 animate-pulse"
                  : "bg-sky-500/95 hover:bg-sky-400 text-slate-950"
              }`}
            >
              {isTalking ? "🔴 Bicara..." : micReady ? "🎙️ Tahan Bicara" : "🎙️ Aktifkan Mic"}
            </button>

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
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={startMiniGame}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold px-5 py-2.5 rounded-full shadow-2xl border-2 border-white animate-bounce text-xs md:text-sm"
          >
            🏆 Mulai Lomba Jatuh Bangun 4 Warna!
          </button>
        </div>
      )}

      {!isSpectator && nearCoach && !miniGameActive && !showModal && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 w-[90%] max-w-lg bg-slate-900/95 text-white p-3.5 rounded-2xl border-2 border-yellow-400 shadow-2xl">
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
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={() => {
              setShowModal(true);
              setQuizIndex(0);
              setFeedback(null);
            }}
            className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-extrabold px-5 py-2.5 rounded-full shadow-2xl border-2 border-white animate-bounce text-xs md:text-sm"
          >
            🚪 Masuk: {activeBuilding.nama_gedung}
          </button>
        </div>
      )}

      {!isSpectator && showModal && activeBuilding && (
        <div className="absolute inset-0 z-20 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 max-w-2xl w-full rounded-2xl p-5 shadow-2xl max-h-[90dvh] overflow-y-auto">
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

      <Canvas shadows camera={{ position: [0, 9, 15], fov: 50 }}>
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
            shirtColor={shirtColor}
            avatarType={avatarType}
            isTalking={isTalking}
            localPosRef={localPosRef}
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