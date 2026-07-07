"use client";

import { forwardRef, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { Body } from "@/lib/physics";
import { useSpace } from "@/lib/store";

interface PlanetProps {
  body: Body;
  isStar?: boolean;
  onGrab: (event: ThreeEvent<PointerEvent>) => void;
  /** Fired on a true click (negligible pointer travel), not a drag/fling. */
  onSelect: () => void;
}

/** Sun emissive levels: calm while you stand on it (readable home screen), hot
 * from a distance (drives the bloom pass). */
const SUN_EMISSIVE_NEAR = 1.05;
const SUN_EMISSIVE_FAR = 3;

/**
 * A single celestial body. The mesh position is driven imperatively by the
 * physics loop in <System> (via the forwarded ref), so this component only owns
 * geometry, material, and pointer interaction. Hovering a planet freezes it
 * (via the store); clicking selects it (dock / go home).
 */
const Planet = forwardRef<THREE.Mesh, PlanetProps>(function Planet(
  { body, isStar = false, onGrab, onSelect },
  ref,
) {
  const setHovered = useSpace((s) => s.setHovered);
  const map = useTexture(body.texture ?? "/textures/2k_mars.jpg");
  const sunMat = useRef<THREE.MeshStandardMaterial>(null);

  // Ease the sun's brightness between "standing on it" and "seen from afar".
  useFrame((_, delta) => {
    if (!isStar || !sunMat.current) return;
    const { view, transition } = useSpace.getState();
    const headingHome =
      transition?.kind === "system-to-sun" || (view === "sun" && !transition);
    const target = headingHome ? SUN_EMISSIVE_NEAR : SUN_EMISSIVE_FAR;
    const k = 1 - Math.exp(-3 * delta);
    sunMat.current.emissiveIntensity +=
      (target - sunMat.current.emissiveIntensity) * k;
  });

  return (
    <mesh
      ref={ref}
      onPointerDown={(e) => {
        if (isStar) return;
        e.stopPropagation();
        (e.target as Element).setPointerCapture?.(e.pointerId);
        document.body.style.cursor = "grabbing";
        onGrab(e);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (!isStar) setHovered(body.id);
        const { view, transition } = useSpace.getState();
        if (view === "system" && !transition) document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        if (!isStar) setHovered(null);
        document.body.style.cursor = "auto";
      }}
      onClick={(e) => {
        e.stopPropagation();
        // R3F click events carry pointer travel in px; treat small travel as a click.
        if (e.delta < 6) onSelect();
      }}
    >
      <sphereGeometry args={[body.radius, 64, 64]} />
      {isStar ? (
        <meshStandardMaterial
          ref={sunMat}
          color="#000000"
          emissive="#ffffff"
          emissiveMap={map}
          emissiveMap-colorSpace={THREE.SRGBColorSpace}
          emissiveMap-anisotropy={8}
          emissiveIntensity={SUN_EMISSIVE_FAR}
          toneMapped={false}
        />
      ) : (
        <meshStandardMaterial
          map={map}
          map-colorSpace={THREE.SRGBColorSpace}
          map-anisotropy={8}
          roughness={1}
          metalness={0}
        />
      )}
    </mesh>
  );
});

export default Planet;
