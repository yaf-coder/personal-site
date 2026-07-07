"use client";

import { forwardRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
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
      <sphereGeometry args={[body.radius, 48, 48]} />
      {isStar ? (
        <meshStandardMaterial
          color={body.color}
          emissive={body.color}
          emissiveIntensity={1}
          toneMapped={false}
        />
      ) : (
        <meshStandardMaterial color={body.color} roughness={0.85} metalness={0.05} />
      )}
    </mesh>
  );
});

export default Planet;
