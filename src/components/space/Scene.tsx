"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Stars, useTexture } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Noise,
  ChromaticAberration,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import {
  createBodies,
  CAMERA_FOV,
  SKY_TEXTURE,
  SYSTEM_CAMERA_POSITION,
} from "@/lib/system-config";
import System from "./System";
import CameraRig from "./CameraRig";

/**
 * Milky Way panorama on an inward-facing sphere, dimmed well below the bloom
 * threshold so only the sun glows. drei's <Stars> adds parallax points on top.
 */
function SkyDome() {
  const map = useTexture(SKY_TEXTURE);
  return (
    // Tilted so the galactic band crosses the overview camera's sight-line
    // (the camera pitches down ~0.63 rad at the orbit plane).
    <mesh rotation={[-0.63, 0, 0.35]}>
      <sphereGeometry args={[300, 48, 48]} />
      <meshBasicMaterial
        map={map}
        map-colorSpace={THREE.SRGBColorSpace}
        color="#c9ccda"
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * The R3F canvas. Loaded client-only (see SceneClient) since three.js has no
 * business running on the server. Bodies are created here so the physics loop
 * (System) and the navigation camera (CameraRig) share one source of truth.
 *
 * Post chain (the "astrophotography" look): sun-only bloom, film grain, a
 * whisper of chromatic aberration, and a vignette.
 */
export default function Scene() {
  const bodies = useMemo(() => createBodies(), []);
  const caOffset = useMemo(() => new THREE.Vector2(0.0004, 0.0004), []);

  return (
    <Canvas
      camera={{
        position: SYSTEM_CAMERA_POSITION.toArray(),
        fov: CAMERA_FOV,
        near: 0.1,
        far: 500,
      }}
      dpr={[1, 2]}
    >
      <color attach="background" args={["#05060a"]} />
      <ambientLight intensity={0.4} />
      <Suspense fallback={null}>
        <SkyDome />
        <Stars radius={220} depth={80} count={7000} factor={4.5} saturation={0} fade speed={0.4} />
        <System bodies={bodies} />
      </Suspense>
      <CameraRig bodies={bodies} />
      <EffectComposer multisampling={4}>
        <Bloom
          intensity={1.1}
          luminanceThreshold={2.1}
          luminanceSmoothing={0.3}
          mipmapBlur
        />
        <Noise premultiply blendFunction={BlendFunction.SCREEN} opacity={0.055} />
        <ChromaticAberration offset={caOffset} radialModulation modulationOffset={0.5} />
        <Vignette offset={0.24} darkness={0.55} />
      </EffectComposer>
    </Canvas>
  );
}
