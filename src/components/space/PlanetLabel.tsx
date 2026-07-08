"use client";

import { forwardRef, useMemo } from "react";
import { Billboard, Text } from "@react-three/drei";
import type { Group } from "three";
import type { Body } from "@/lib/physics";

/**
 * Text height as a multiple of the planet's radius. Kept fixed so the title
 * always looks the same size relative to its planet, and perspective scales
 * both together with distance.
 */
const LABEL_SIZE_FACTOR = 0.75;
/** Approx glyph advance (em) for the uppercase font — sets arc letter spacing. */
const CHAR_ADVANCE = 0.62;
/** Gap between the planet surface and the text, in fontSize units. */
const ARC_GAP = 0.9;

/**
 * A project title arced across the top of its planet, like an engraving on the
 * rim. Each character is placed along a circle centered on the planet and
 * rotated to follow the tangent, so the whole name curves over the top edge.
 * Billboarded to always face the camera; positioned each frame by <System> at
 * the planet's center. Non-raycasting so it never blocks grab/click.
 *
 * `sizeFactor` overrides the text-to-radius ratio — the star is far larger than
 * any planet, so its HOME label uses a smaller factor to stay clear of the
 * innermost orbit.
 */
const PlanetLabel = forwardRef<
  Group,
  { body: Body; sizeFactor?: number; charAdvance?: number }
>(function PlanetLabel(
  { body, sizeFactor = LABEL_SIZE_FACTOR, charAdvance = CHAR_ADVANCE },
  ref,
) {
  const fontSize = body.radius * sizeFactor;
  const chars = useMemo(() => body.name.toUpperCase().split(""), [body.name]);

  // Radius of the character baseline circle, just outside the planet silhouette.
  const arcRadius = body.radius + fontSize * ARC_GAP;
  // Angle each character advances along the arc; center the word over the top.
  const step = (fontSize * charAdvance) / arcRadius;
  const startAngle = Math.PI / 2 + ((chars.length - 1) * step) / 2;

  return (
    <Billboard ref={ref}>
      {chars.map((ch, i) => {
        if (ch === " ") return null;
        const angle = startAngle - i * step;
        return (
          <Text
            key={i}
            position={[Math.cos(angle) * arcRadius, Math.sin(angle) * arcRadius, 0]}
            rotation={[0, 0, angle - Math.PI / 2]}
            fontSize={fontSize}
            anchorX="center"
            anchorY="middle"
            color="#f4efe6"
            outlineWidth={fontSize * 0.04}
            outlineColor="#05060a"
            outlineOpacity={0.85}
            raycast={() => null}
          >
            {ch}
          </Text>
        );
      })}
    </Billboard>
  );
});

export default PlanetLabel;
