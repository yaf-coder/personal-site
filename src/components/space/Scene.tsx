"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { createBodies, CAMERA_FOV, SYSTEM_CAMERA_POSITION } from "@/lib/system-config";
import System from "./System";
import CameraRig from "./CameraRig";

/**
 * The R3F canvas. Loaded client-only (see SceneClient) since three.js has no
 * business running on the server. Bodies are created here so the physics loop
 * (System) and the navigation camera (CameraRig) share one source of truth.
 */
export default function Scene() {
  const bodies = useMemo(() => createBodies(), []);

  return (
    <Canvas
      camera={{
        position: SYSTEM_CAMERA_POSITION.toArray(),
        fov: CAMERA_FOV,
        near: 0.1,
        far: 500,
      }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#05060a"]} />
      <ambientLight intensity={0.25} />
      <Stars radius={220} depth={80} count={6000} factor={4} saturation={0} fade speed={0.4} />
      <System bodies={bodies} />
      <CameraRig bodies={bodies} />
    </Canvas>
  );
}
