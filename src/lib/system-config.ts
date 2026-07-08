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
  /** Project card content. */
  tagline: string;
  /** Body copy, one string per paragraph. */
  blurb: string[];
  /** Tech-stack chips shown on the planet card and in the technical directory. */
  tech: string[];
  /** High-level technical concepts/domains — categorizes the project in the directory. */
  concepts: string[];
  /** Source link, rendered at the foot of the card. Omitted where private. */
  github?: string;
  /**
   * Sell-first flagship: hide tech chips + source link on the planet card and
   * keep the copy non-technical. The technical directory still lists its stack.
   */
  pitchOnly?: boolean;
}

export const SUN_TEXTURE = "/textures/2k_sun.jpg";
export const SKY_TEXTURE = "/textures/4k_stars_milky_way.jpg";

/**
 * Real projects, ordered best-to-worst == biggest-to-smallest planet. Each
 * def keeps its texture/color/size; only the content is authored per body.
 * Jupiter (biggest) = the flagship; Uranus (smallest) = the last of the five.
 */
export const PLANET_DEFS: PlanetDef[] = [
  // Mars — 4th.
  {
    id: "p1", name: "Swordfish", slot: 0.06, radius: 0.8, mass: 30, color: "#9c4f2e",
    texture: "/textures/2k_mars.jpg", spin: 0.14,
    tagline: "autonomous submarine simulator",
    blurb: [
      "A full-stack autonomous underwater vehicle simulator that flies a torpedo-class sub through the real ocean. A deterministic six-degree-of-freedom core models the vehicle with Fossen-style hydrodynamics — added mass, Coriolis coupling, quadratic damping, and buoyant restoring moments — integrated at 200 Hz with classic RK4 for rock-solid stability.",
      "It runs on real-world data: GMT earth_relief bathymetry and HYCOM ocean-current fields, sampled live so real currents actually push the sub off-course. An energy-aware planner routes by great circle and falls back to A* land-avoidance, a PID flight controller with derivative-on-measurement holds the line, and a precompute-then-replay engine simulates the entire mission at ~125× real-time so the whole timeline is scrubbable the instant you hit plan. A MapLibre browser client renders georeferenced bathymetry, current vectors, and live telemetry streamed over SSE.",
    ],
    tech: ["C++17", "Eigen", "TypeScript", "MapLibre GL", "SSE", "A*"],
    concepts: ["Physics Simulation", "Numerical Methods", "Pathfinding", "Control Systems", "Geospatial", "Real-Time Streaming"],
    github: "https://github.com/yaf-coder/swordfish",
  },
  // Neptune — 2nd.
  {
    id: "p2", name: "Veritas", slot: 0.3, radius: 1.1, mass: 55, color: "#33538f",
    texture: "/textures/2k_neptune.jpg", spin: 0.1,
    tagline: "hallucination-proof research",
    blurb: [
      "A literature-review engine built on one uncompromising rule: every sentence it writes must trace back to a real quote in a real paper. Veritas turns a research question into a fully-sourced review with zero hallucinated claims — each assertion links straight to the passage that backs it, surfaced in expandable source cards. Winner at Tartan Hacks.",
      "Under the hood, a streaming FastAPI pipeline discovers candidate papers, ranks them with LLM relevance scoring, and then runs a multi-stage chain — quote extraction, quote refinement, claim verification, and synthesis — that emits both a full literature review and an executive summary. An MCP server bridges the agent to academic databases, and drag-and-dropped PDFs become the evidence base when you bring your own sources.",
    ],
    tech: ["React", "Vite", "FastAPI", "Python", "LLM pipelines", "MCP"],
    concepts: ["Multi-Agent", "LLM Pipelines", "Retrieval / RAG", "NLP", "Claim Verification", "Full-Stack"],
    github: "https://github.com/yaf-coder/veritas",
  },
  // Venus — 3rd.
  {
    id: "p3", name: "SimpyC", slot: 0.52, radius: 0.95, mass: 42, color: "#a3823f",
    texture: "/textures/2k_venus_atmosphere.jpg", spin: 0.06,
    tagline: "discrete-event simulation in C",
    blurb: [
      "A ground-up rewrite of SimPy's discrete-event simulation core in pure C. It keeps the elegant process-based model — write processes as plain functions that yield events and let the scheduler run them in virtual time — but tears out the Python runtime and replaces it with hand-tuned systems code.",
      "The engine runs on a flat-array binary min-heap event queue, hand-written stack-switching coroutines with dedicated assembly for AArch64 and x86-64 (each context switch is ~13 instructions — no ucontext, no syscalls), and pool allocators that reach zero heap allocations per yield in steady state. The payoff: 21.9× faster than reference SimPy, 15× less peak memory, and an ~18× geometric-mean speedup across all fifteen measured primitives.",
    ],
    tech: ["C", "x86-64 / ARM64 asm", "coroutines", "allocators"],
    concepts: ["Systems Programming", "Data Structures", "Algorithms", "Concurrency", "Performance Optimization", "Simulation"],
    github: "https://github.com/yaf-coder/simpyc",
  },
  // Jupiter (biggest) — the flagship. Sell the infinite context; no technicals.
  {
    id: "p4", name: "Matrix", slot: 0.76, radius: 1.35, mass: 70, color: "#8a6a4f",
    texture: "/textures/2k_jupiter.jpg", spin: 0.18,
    tagline: "the AI that never forgets",
    blurb: [
      "An AI companion with truly infinite memory. Every conversation, every detail, every preference — Matrix weaves it into a living memory of your world that carries seamlessly from one day to the next. You never start from scratch, and you never repeat yourself.",
      "Most assistants forget the moment you close the tab. Matrix doesn't. It quietly learns who you are, connects the dots across everything you've ever told it, and grows more useful the longer you use it — a second brain that actually remembers your life instead of resetting every session.",
      "Wired into your calendar, email, and daily routine, it turns scattered context into something that finally feels like it knows you — anticipating what you need before you ask. Currently live in a private, invite-only beta.",
    ],
    // Sell-first on its planet card; the directory still shows the real stack.
    pitchOnly: true,
    tech: ["Rust", "Python", "axum", "Claude API", "Docker"],
    concepts: ["Multi-Agent", "Knowledge Graphs", "LLM Reasoning", "Databases", "Distributed Systems", "Systems Programming"],
  },
  // Uranus (smallest) — 5th.
  {
    id: "p5", name: "Concordia", slot: 1.0, radius: 0.7, mass: 22, color: "#4f8a8f",
    texture: "/textures/2k_uranus.jpg", spin: 0.12,
    tagline: "matchmaking on substance",
    blurb: [
      "A matchmaking platform that pairs people on substance instead of snap judgments. Users answer a set of open-ended questions about how they actually live and love, and an LLM agent reads the free-text responses to compute nuanced, explainable compatibility scores — the depth of a long conversation compressed into a ranked feed of people worth meeting.",
      "The backend is a high-performance C++ service on the Drogon framework, with JWT auth and a migration-managed relational schema; a Python FastAPI agent handles the LLM compatibility scoring; and a React + Vite + Tailwind frontend, animated with Framer Motion, delivers the swipe-card experience end to end.",
    ],
    tech: ["C++", "Drogon", "Python", "FastAPI", "React", "PostgreSQL"],
    concepts: ["Full-Stack", "Databases", "LLM / AI", "Auth & Security", "Web", "Recommendation"],
    github: "https://github.com/yaf-coder/concordia",
  },
];

/** Projects ranked best-to-worst — i.e. by planet size, largest first. */
export const PROJECTS_BY_RANK: PlanetDef[] = [...PLANET_DEFS].sort(
  (a, b) => b.radius - a.radius,
);

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
      name: "HOME",
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
