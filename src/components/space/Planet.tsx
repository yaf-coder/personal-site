"use client";

import { forwardRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { Body } from "@/lib/physics";

interface PlanetProps {
  body: Body;
  isStar?: boolean;
  onGrab: (event: ThreeEvent<PointerEvent>) => void;
}

/**
 * A single celestial body. The mesh position is driven imperatively by the
 * physics loop in <System> (via the forwarded ref), so this component only owns
 * geometry, material, and pointer interaction.
 */
const Planet = forwardRef<THREE.Mesh, PlanetProps>(function Planet(
  { body, isStar = false, onGrab },
  ref,
) {
  return (
    <mesh
      ref={ref}
      onPointerDown={(e) => {
        e.stopPropagation();
        (e.target as Element).setPointerCapture?.(e.pointerId);
        document.body.style.cursor = "grabbing";
        onGrab(e);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "grab";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      <sphereGeometry args={[body.radius, 48, 48]} />
      {isStar ? (
        <meshStandardMaterial
          color={body.color}
          emissive={body.color}
          emissiveIntensity={2.2}
          toneMapped={false}
        />
      ) : (
        <meshStandardMaterial color={body.color} roughness={0.85} metalness={0.05} />
      )}
    </mesh>
  );
});

export default Planet;
