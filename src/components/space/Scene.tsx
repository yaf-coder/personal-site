"use client";

import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import System from "./System";

/**
 * The R3F canvas. Loaded client-only (see SceneClient) since three.js has no
 * business running on the server. Post-processing and camera choreography land
 * in later phases — this is the raw physics playground.
 */
export default function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 22, 30], fov: 50, near: 0.1, far: 500 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#05060a"]} />
      <ambientLight intensity={0.25} />
      <Stars radius={220} depth={80} count={6000} factor={4} saturation={0} fade speed={0.4} />
      <System />
    </Canvas>
  );
}
