"use client";

import { forwardRef } from "react";
import { Billboard, Text } from "@react-three/drei";
import type { Group } from "three";
import type { Body } from "@/lib/physics";

/**
 * Text world-height as a multiple of the planet's radius. Because the label is
 * real 3D geometry, keeping this ratio fixed means the title always looks the
 * same size *relative to its planet* — bigger planets get bigger titles, and
 * perspective shrinks/grows both together as the planet nears or recedes.
 */
const LABEL_SIZE_FACTOR = 1.1;

/**
 * A project title floating above its planet. Billboarded so it always faces the
 * camera; positioned each frame by <System> (via the forwarded ref) to track the
 * orbiting body. Non-raycasting so it never blocks grab/click on the planet.
 */
const PlanetLabel = forwardRef<Group, { body: Body }>(function PlanetLabel({ body }, ref) {
  const fontSize = body.radius * LABEL_SIZE_FACTOR;
  return (
    <Billboard ref={ref}>
      <Text
        fontSize={fontSize}
        anchorX="center"
        anchorY="bottom"
        color="#f4efe6"
        letterSpacing={0.12}
        outlineWidth={fontSize * 0.03}
        outlineColor="#05060a"
        outlineOpacity={0.85}
        raycast={() => null}
      >
        {body.name.toUpperCase()}
      </Text>
    </Billboard>
  );
});

export default PlanetLabel;
