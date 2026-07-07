import * as THREE from "three";
import type { Body, ConfineOptions } from "./physics";

/**
 * Simulation constants. These are tuned for "feel", not realism — gravity is
 * strong and time is slowed so inner planets orbit in ~10s and outer ones drift
 * slowly. Tweak live in the preview.
 */
export const G = 1;
export const SOFTENING = 0.6;
/** Sim-seconds per wall-second. Lower = slower, more graceful orbits. */
export const TIME_SCALE = 0.18;
/** Sub-steps per frame — keeps flings near the star stable. */
export const SUBSTEPS = 4;
/** Max fling speed (sim units/s) — high, for a dramatic slingshot. */
export const MAX_FLING_SPEED = 90;

const STAR_MASS = 2600;
export const STAR_RADIUS = 2.4;

/* --- Camera --- */
export const CAMERA_FOV = 50;
/** The system-overview camera pose; also defines the zoom-out axis from the sun. */
export const SYSTEM_CAMERA_POSITION = new THREE.Vector3(0, 22, 30);

/* --- Screen-fit confinement tuning (see applyScreenConfinement) --- */
/** Fraction of the inscribed screen radius used as the outer orbit band. */
export const ORBIT_FIT_FACTOR = 0.9;
/** Clearance between the star surface and the innermost orbit. */
export const R_MIN_MARGIN = 2.6;
/** Fallback outer radius before the real viewport has been measured. */
export const DEFAULT_FIT_RADIUS = 12;
/** Never let the band collapse below this, even on tiny screens. */
export const MIN_FIT_RADIUS = 6;

export const CONFINE: Omit<ConfineOptions, "rMin" | "rMax" | "dt"> = {
  G,
  starMass: STAR_MASS,
  restitution: 1, // perfectly elastic inner wall
  springK: 300, // stiff: hard flings travel only a few units past the screen
  radialDamping: 2, // light: slings back at ~85% speed, settles in a few wobbles
  tangentBlend: 0.05,
  maxSpeed: 120,
};

/** Perfectly elastic — bumps conserve energy, no orbital decay. */
export const COLLISION_RESTITUTION = 1;

export interface PlanetDef {
  id: string;
  name: string;
  /** Orbital slot in [0,1]: 0 = innermost band, 1 = outermost. */
  slot: number;
  radius: number;
  mass: number;
  /** Overlay tint — matched to the texture's dominant hue. */
  color: string;
  /** Equirectangular surface map (Solar System Scope, CC BY 4.0). */
  texture: string;
  /** Axial spin (rad/s wall time), cosmetic. */
  spin: number;
  /** Project card content (placeholder until real content lands). */
  tagline: string;
  blurb: string;
  tech: string[];
}

export const SUN_TEXTURE = "/textures/2k_sun.jpg";
export const SKY_TEXTURE = "/textures/8k_stars_milky_way.jpg";

/** Placeholder projects — swapped for real content in a later phase. */
export const PLANET_DEFS: PlanetDef[] = [
  {
    id: "p1", name: "Project Alpha", slot: 0.06, radius: 0.8, mass: 30, color: "#9c4f2e",
    texture: "/textures/2k_mars.jpg", spin: 0.14,
    tagline: "distributed systems",
    blurb:
      "Placeholder case study. A short paragraph about what this project is, the problem it solves, and the interesting engineering underneath. Real content lands here later.",
    tech: ["Go", "Kafka", "Postgres"],
  },
  {
    id: "p2", name: "Project Beta", slot: 0.3, radius: 1.1, mass: 55, color: "#33538f",
    texture: "/textures/2k_neptune.jpg", spin: 0.1,
    tagline: "full-stack product",
    blurb:
      "Placeholder case study. What it does, who used it, and the hard part you solved. Swap in the real story when ready.",
    tech: ["TypeScript", "Next.js", "tRPC"],
  },
  {
    id: "p3", name: "Project Gamma", slot: 0.52, radius: 0.95, mass: 42, color: "#a3823f",
    texture: "/textures/2k_venus_atmosphere.jpg", spin: 0.06,
    tagline: "data & ML pipeline",
    blurb:
      "Placeholder case study. Throughput numbers, architecture choices, and the tradeoffs behind them go here.",
    tech: ["Python", "Airflow", "BigQuery"],
  },
  {
    id: "p4", name: "Project Delta", slot: 0.76, radius: 1.35, mass: 70, color: "#8a6a4f",
    texture: "/textures/2k_jupiter.jpg", spin: 0.18,
    tagline: "infrastructure",
    blurb:
      "Placeholder case study. The biggest planet gets the flagship project — describe scale, reliability, and impact.",
    tech: ["Kubernetes", "Terraform", "AWS"],
  },
  {
    id: "p5", name: "Project Epsilon", slot: 1.0, radius: 0.7, mass: 22, color: "#4f8a8f",
    texture: "/textures/2k_uranus.jpg", spin: 0.12,
    tagline: "side quest",
    blurb:
      "Placeholder case study. A small, fun one — a tool, a game, a hack that shows range.",
    tech: ["Rust", "WASM"],
  },
];

/**
 * Place every planet on a (near-)circular orbit whose radius is its slot mapped
 * onto the current screen-fit band [rMin, rMax], with the circular-orbit speed
 * v = sqrt(G*M/r) perpendicular to its radius. Called at init and whenever we
 * want to re-fit orbits to the screen.
 */
export function layoutOrbits(bodies: Body[], rMin: number, rMax: number): void {
  // Golden-angle spacing so adjacent lanes never spawn aligned (which, with
  // elastic collisions, would fling an overlapping pair off screen on load).
  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
  let n = 0;
  for (const b of bodies) {
    if (b.fixed) continue;
    const slot = b.orbitSlot ?? 0.5;
    const radius = THREE.MathUtils.lerp(rMin, rMax, slot);
    b.homeRadius = radius;
    const angle = n++ * GOLDEN_ANGLE;
    b.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    const speed = Math.sqrt((G * STAR_MASS) / radius);
    b.velocity.set(-Math.sin(angle), 0, Math.cos(angle)).multiplyScalar(speed);
  }
}

/**
 * Build the initial system: a fixed central star at the origin plus placeholder
 * planets laid out on a default band (re-fit to the real viewport on mount).
 */
export function createBodies(): Body[] {
  const bodies: Body[] = [
    {
      id: "star",
      name: "You",
      mass: STAR_MASS,
      radius: STAR_RADIUS,
      color: "#ffd9a0",
      texture: SUN_TEXTURE,
      spin: 0.015,
      fixed: true,
      position: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
    },
  ];

  for (const p of PLANET_DEFS) {
    bodies.push({
      id: p.id,
      name: p.name,
      mass: p.mass,
      radius: p.radius,
      color: p.color,
      texture: p.texture,
      spin: p.spin,
      orbitSlot: p.slot,
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
    });
  }

  layoutOrbits(bodies, STAR_RADIUS + R_MIN_MARGIN, DEFAULT_FIT_RADIUS);
  return bodies;
}
