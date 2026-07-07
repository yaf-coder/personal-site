import * as THREE from "three";

/**
 * A gravitating body in the simulation. Positions/velocities live on the XZ
 * plane (y = 0) so the "solar system" reads as a top-down disk under the camera.
 */
export interface Body {
  id: string;
  name: string;
  mass: number;
  /** Visual sphere radius (world units), unrelated to gravitational mass. */
  radius: number;
  color: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  /** Anchored bodies (the central "star" = you) never move. */
  fixed?: boolean;
  /** Preferred orbital slot in [0,1]; mapped onto the screen-fit band at layout. */
  orbitSlot?: number;
  /** Resting orbit radius this planet is stabilized toward (set at layout). */
  homeRadius?: number;
}

const _dir = new THREE.Vector3();

/**
 * Newtonian n-body accelerations with Plummer softening to avoid the 1/r^2
 * singularity when bodies pass close. Writes into `out` (one Vector3 per body,
 * reused across frames — no allocation in the hot loop).
 *
 *   a_i = sum_j!=i  G * m_j * (x_j - x_i) / (|x_j - x_i|^2 + eps^2)^(3/2)
 */
export function computeAccelerations(
  bodies: Body[],
  G: number,
  softening: number,
  out: THREE.Vector3[],
): void {
  const eps2 = softening * softening;
  for (let i = 0; i < bodies.length; i++) out[i].set(0, 0, 0);

  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      _dir.subVectors(bodies[j].position, bodies[i].position);
      const invDist = 1 / Math.sqrt(_dir.lengthSq() + eps2);
      const invDist3 = invDist * invDist * invDist;
      const f = G * invDist3;
      // Equal and opposite: dir points from i -> j.
      out[i].addScaledVector(_dir, f * bodies[j].mass);
      out[j].addScaledVector(_dir, -f * bodies[i].mass);
    }
  }
}

/**
 * Central-force gravity: every planet is attracted to the star (at `starIndex`)
 * only, not to the other planets. This keeps orbits stable and non-decaying —
 * mutual planet gravity in a tightly packed band bleeds energy and collapses the
 * system into the star. Planets interact with each other through collisions
 * instead. Writes into `out` (reused each frame, no allocation).
 */
export function computeCentralAccelerations(
  bodies: Body[],
  starIndex: number,
  G: number,
  softening: number,
  out: THREE.Vector3[],
): void {
  const eps2 = softening * softening;
  const star = bodies[starIndex];
  const gm = G * star.mass;
  for (let i = 0; i < bodies.length; i++) {
    if (i === starIndex || bodies[i].fixed) {
      out[i].set(0, 0, 0);
      continue;
    }
    _dir.subVectors(star.position, bodies[i].position);
    const invDist = 1 / Math.sqrt(_dir.lengthSq() + eps2);
    const invDist3 = invDist * invDist * invDist;
    out[i].copy(_dir).multiplyScalar(gm * invDist3);
  }
}

/**
 * One velocity-Verlet step. `accel(out)` fills `out` with a(t+dt) for the given
 * positions. `accPrev` holds a(t) on entry and a(t+dt) on exit, so the caller
 * can feed it straight back into the next step. Fixed and `skipIndex` (grabbed)
 * bodies are not integrated.
 */
export function stepVerlet(
  bodies: Body[],
  dt: number,
  accPrev: THREE.Vector3[],
  accScratch: THREE.Vector3[],
  skipIndex: number,
  accel: (out: THREE.Vector3[]) => void,
): void {
  const halfDtSq = 0.5 * dt * dt;
  // x(t+dt) = x + v*dt + 0.5*a*dt^2
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    if (b.fixed || i === skipIndex) continue;
    b.position.addScaledVector(b.velocity, dt).addScaledVector(accPrev[i], halfDtSq);
  }

  accel(accScratch);

  const halfDt = 0.5 * dt;
  // v(t+dt) = v + 0.5*(a(t) + a(t+dt))*dt
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    if (b.fixed || i === skipIndex) continue;
    b.velocity.addScaledVector(accPrev[i], halfDt).addScaledVector(accScratch[i], halfDt);
    // Roll a(t+dt) into accPrev for the next step.
    accPrev[i].copy(accScratch[i]);
  }
}

/* ------------------------------------------------------------------ *
 *  Orbit stabilizer — the single "keep it tidy and on screen" algorithm.
 *
 *  Central gravity gives each planet an orbit, but flings, collisions and
 *  the odd close pass leave orbits eccentric or displaced. This controller
 *  runs each frame *after* integration and behaves like an elastic tether
 *  to each planet's own `homeRadius`:
 *
 *    - Radial: a stiff, nearly-conservative spring toward home. A hard fling
 *      rockets outward but the spring stores that energy over a short
 *      distance and slings it back at almost the same speed — a bounded
 *      slingshot that stays near the screen. Light damping lets the last
 *      wobble settle instead of ringing forever.
 *    - Tangential: eases speed toward the local circular-orbit speed
 *      (preserving direction) so orbits round out instead of clumping.
 *    - Home radius is clamped to [rMin, rMax], and rMax tracks the viewport,
 *      so every resting orbit fits the screen.
 *    - An elastic inner wall + global speed cap are safety nets.
 * ------------------------------------------------------------------ */

export interface ConfineOptions {
  /** Inner radius: elastic wall keeping planets clear of the star. */
  rMin: number;
  /** Outer radius: largest orbit that fits the screen; clamps home radii. */
  rMax: number;
  G: number;
  starMass: number;
  /** Bounce energy retained at the inner wall (1 = perfectly elastic). */
  restitution: number;
  /** Radial spring stiffness toward home (higher = stiffer, shorter throws). */
  springK: number;
  /** Radial damping (small = elastic return, larger = settles faster). */
  radialDamping: number;
  /** How fast tangential velocity eases toward circular (0..1/frame). */
  tangentBlend: number;
  /** Hard cap on any body's speed (sim units/s). */
  maxSpeed: number;
  /** Sim timestep for this frame (spring/damping integration). */
  dt: number;
  /** Body under pointer control — left untouched. */
  skipIndex: number;
}

export function applyScreenConfinement(bodies: Body[], o: ConfineOptions): void {
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    if (b.fixed || i === o.skipIndex) continue;

    const rx = b.position.x;
    const rz = b.position.z;
    let r = Math.hypot(rx, rz);
    if (r < 1e-4) continue;

    // Radial (n) and tangential (t) unit vectors on the XZ plane.
    const nx = rx / r;
    const nz = rz / r;

    // Elastic inner wall: snap out and reflect inward motion.
    if (r < o.rMin) {
      b.position.x = nx * o.rMin;
      b.position.z = nz * o.rMin;
      r = o.rMin;
      const vrIn = b.velocity.x * nx + b.velocity.z * nz;
      if (vrIn < 0) {
        b.velocity.x -= (1 + o.restitution) * vrIn * nx;
        b.velocity.z -= (1 + o.restitution) * vrIn * nz;
      }
    }

    const tx = -nz;
    const tz = nx;
    let vr = b.velocity.x * nx + b.velocity.z * nz;
    let vt = b.velocity.x * tx + b.velocity.z * tz;

    // Stiff spring toward home (bounded, energy-returning) + light damping.
    const home = Math.min(Math.max(b.homeRadius ?? r, o.rMin), o.rMax);
    const radialAccel = -o.springK * (r - home) - o.radialDamping * vr;
    vr += radialAccel * o.dt;

    // Ease tangential speed toward the local circular-orbit speed.
    const vCirc = Math.sqrt((o.G * o.starMass) / r);
    const dir = vt >= 0 ? 1 : -1;
    vt += (dir * vCirc - vt) * o.tangentBlend;

    b.velocity.x = vr * nx + vt * tx;
    b.velocity.z = vr * nz + vt * tz;

    // Global speed cap (safety only — the spring is conservative).
    const speed = b.velocity.length();
    if (speed > o.maxSpeed) b.velocity.multiplyScalar(o.maxSpeed / speed);
  }
}

/**
 * Resolve sphere-sphere collisions on the XZ plane with positional correction
 * and an impulse response weighted by mass. Fixed bodies (the star) and the
 * grabbed body act as immovable, so planets bounce off them and off each other.
 */
export function resolveCollisions(
  bodies: Body[],
  restitution: number,
  skipIndex: number,
): void {
  for (let i = 0; i < bodies.length; i++) {
    const bi = bodies[i];
    const invI = bi.fixed || i === skipIndex ? 0 : 1 / bi.mass;
    for (let j = i + 1; j < bodies.length; j++) {
      const bj = bodies[j];
      const invJ = bj.fixed || j === skipIndex ? 0 : 1 / bj.mass;
      const invSum = invI + invJ;
      if (invSum === 0) continue;

      const dx = bj.position.x - bi.position.x;
      const dz = bj.position.z - bi.position.z;
      const distSq = dx * dx + dz * dz;
      const minDist = bi.radius + bj.radius;
      if (distSq >= minDist * minDist || distSq < 1e-8) continue;

      const dist = Math.sqrt(distSq);
      const nx = dx / dist;
      const nz = dz / dist;

      // Push the pair apart, split by inverse mass.
      const corr = (minDist - dist) / invSum;
      bi.position.x -= nx * corr * invI;
      bi.position.z -= nz * corr * invI;
      bj.position.x += nx * corr * invJ;
      bj.position.z += nz * corr * invJ;

      // Impulse along the normal, only if they're approaching.
      const rvn =
        (bj.velocity.x - bi.velocity.x) * nx + (bj.velocity.z - bi.velocity.z) * nz;
      if (rvn < 0) {
        const jimp = (-(1 + restitution) * rvn) / invSum;
        bi.velocity.x -= jimp * invI * nx;
        bi.velocity.z -= jimp * invI * nz;
        bj.velocity.x += jimp * invJ * nx;
        bj.velocity.z += jimp * invJ * nz;
      }
    }
  }
}

/**
 * Largest circle centered on the origin (the star) that fits inside a convex
 * quad — the four viewport corners projected onto the orbit plane. Equals the
 * minimum distance from the origin to the quad's four edges.
 */
export function inscribedRadius(corners: THREE.Vector3[]): number {
  let min = Infinity;
  for (let i = 0; i < corners.length; i++) {
    const a = corners[i];
    const b = corners[(i + 1) % corners.length];
    const ux = b.x - a.x;
    const uz = b.z - a.z;
    const len = Math.hypot(ux, uz) || 1e-6;
    // |u x (origin - a)| / |u|
    const cross = Math.abs(ux * -a.z - uz * -a.x);
    min = Math.min(min, cross / len);
  }
  return min;
}

