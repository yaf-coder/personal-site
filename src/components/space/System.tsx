"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  applyScreenConfinement,
  computeCentralAccelerations,
  inscribedRadius,
  resolveCollisions,
  stepVerlet,
  type Body,
} from "@/lib/physics";
import {
  layoutOrbits,
  CAMERA_FOV,
  CONFINE,
  COLLISION_RESTITUTION,
  DEFAULT_FIT_RADIUS,
  G,
  MAX_FLING_SPEED,
  MIN_FIT_RADIUS,
  ORBIT_FIT_FACTOR,
  R_MIN_MARGIN,
  SOFTENING,
  STAR_RADIUS,
  SUBSTEPS,
  SYSTEM_CAMERA_POSITION,
  TIME_SCALE,
} from "@/lib/system-config";
import { useSpace } from "@/lib/store";
import Planet from "./Planet";
import PlanetLabel from "./PlanetLabel";

/** Mutable state for the body currently held by the pointer. */
interface GrabState {
  index: number;
  /** Pointer world position last frame — used to derive fling velocity. */
  lastPointer: THREE.Vector3;
  /** Smoothed release velocity (sim units/s). */
  velocity: THREE.Vector3;
}

const ORBIT_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const NDC_CORNERS: [number, number][] = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
];

export default function System({ bodies }: { bodies: Body[] }) {
  // Reusable acceleration buffers (no per-frame allocation).
  const accPrev = useRef(bodies.map(() => new THREE.Vector3()));
  const accScratch = useRef(bodies.map(() => new THREE.Vector3()));

  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const labelRefs = useRef<(THREE.Group | null)[]>([]);
  const grab = useRef<GrabState | null>(null);
  /** Bodies excluded from integration this frame: grabbed, hovered, docked. */
  const frozen = useRef(new Set<number>());

  const { camera, pointer, size } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const pointerWorld = useRef(new THREE.Vector3());
  const idToIndex = useMemo(
    () => new Map(bodies.map((b, i) => [b.id, i] as const)),
    [bodies],
  );

  const dock = useSpace((s) => s.dock);
  const goHome = useSpace((s) => s.goHome);

  // Star-only gravity (index 0), reused by both the seed and the integrator.
  const accel = useMemo(
    () => (out: THREE.Vector3[]) => computeCentralAccelerations(bodies, 0, G, SOFTENING, out),
    [bodies],
  );

  // Screen-fit band. rMin is fixed (clearance around the star); rMax is measured
  // from the viewport each mount/resize.
  const rMin = STAR_RADIUS + R_MIN_MARGIN;
  const rMax = useRef(DEFAULT_FIT_RADIUS);

  // The live camera parks on the sun or a planet, so the fit is measured from a
  // scratch camera at the system-overview pose. Only runs on mount/resize, so
  // constructing it per call is fine (and keeps render-scope values immutable).
  function measureFitRadius(): number {
    const fitCam = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 500);
    fitCam.aspect = size.width / size.height;
    fitCam.position.copy(SYSTEM_CAMERA_POSITION);
    fitCam.lookAt(0, 0, 0);
    fitCam.updateProjectionMatrix();
    fitCam.updateMatrixWorld();
    const ndc = new THREE.Vector2();
    const corners: THREE.Vector3[] = [];
    for (const [x, y] of NDC_CORNERS) {
      ndc.set(x, y);
      raycaster.setFromCamera(ndc, fitCam);
      const hit = new THREE.Vector3();
      if (!raycaster.ray.intersectPlane(ORBIT_PLANE, hit)) return rMax.current;
      corners.push(hit);
    }
    const fit = inscribedRadius(corners) * ORBIT_FIT_FACTOR;
    return Math.max(fit, MIN_FIT_RADIUS);
  }

  // Measure the screen on mount + resize. On first mount, re-fit the orbits to
  // the real viewport and seed accelerations before the first painted frame.
  const laidOut = useRef(false);
  useEffect(() => {
    rMax.current = measureFitRadius();
    if (!laidOut.current) {
      layoutOrbits(bodies, rMin, rMax.current);
      accel(accPrev.current);
      for (let i = 0; i < bodies.length; i++) {
        meshRefs.current[i]?.position.copy(bodies[i].position);
      }
      laidOut.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height]);

  // Release the grabbed body anywhere the pointer lifts (even off a planet).
  useEffect(() => {
    function release() {
      const g = grab.current;
      if (!g) return;
      bodies[g.index].velocity.copy(g.velocity).clampLength(0, MAX_FLING_SPEED);
      grab.current = null;
      document.body.style.cursor = "auto";
    }
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, [bodies]);

  function handleGrab(index: number) {
    const { view, transition } = useSpace.getState();
    if (view !== "system" || transition) return; // playground input only when idle in system view
    if (bodies[index].fixed) return; // the star (you) stays anchored
    raycaster.setFromCamera(pointer, camera);
    const hit = new THREE.Vector3();
    raycaster.ray.intersectPlane(ORBIT_PLANE, hit);
    grab.current = { index, lastPointer: hit.clone(), velocity: new THREE.Vector3() };
  }

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30) * TIME_SCALE;
    if (dt <= 0) return;

    // Assemble this frame's frozen set: grabbed + hovered + docked bodies.
    const { hoveredId, focusedId, view } = useSpace.getState();
    frozen.current.clear();
    const g = grab.current;
    if (g) frozen.current.add(g.index);
    const hi = hoveredId ? idToIndex.get(hoveredId) : undefined;
    if (hi !== undefined) frozen.current.add(hi);
    const fi = focusedId ? idToIndex.get(focusedId) : undefined;
    if (fi !== undefined) frozen.current.add(fi);

    // Drive the grabbed body toward the pointer and estimate its fling velocity.
    if (g) {
      raycaster.setFromCamera(pointer, camera);
      if (raycaster.ray.intersectPlane(ORBIT_PLANE, pointerWorld.current)) {
        const body = bodies[g.index];
        const instVel = pointerWorld.current.clone().sub(g.lastPointer).multiplyScalar(1 / dt);
        g.velocity.lerp(instVel, 0.35);
        g.lastPointer.copy(pointerWorld.current);
        body.position.lerp(pointerWorld.current, 0.4);
        body.velocity.set(0, 0, 0);
      }
    }

    // Integrate gravity in sub-steps for stability.
    const h = dt / SUBSTEPS;
    for (let s = 0; s < SUBSTEPS; s++) {
      stepVerlet(bodies, h, accPrev.current, accScratch.current, frozen.current, accel);
    }

    // Keep the system on screen and let bodies bump into each other.
    resolveCollisions(bodies, COLLISION_RESTITUTION, frozen.current);
    applyScreenConfinement(
      bodies,
      { ...CONFINE, rMin, rMax: rMax.current, dt },
      frozen.current,
    );

    // Push simulated positions onto the meshes + cosmetic axial spin.
    // Titles float above their planet, but only while browsing the system view.
    const showLabels = view === "system";
    for (let i = 0; i < bodies.length; i++) {
      const body = bodies[i];
      const mesh = meshRefs.current[i];
      if (mesh) {
        mesh.position.copy(body.position);
        mesh.rotation.y += (body.spin ?? 0) * delta;
      }
      const label = labelRefs.current[i];
      if (label) {
        label.visible = showLabels;
        // Arc is centered on the planet, so anchor the label at its center.
        if (showLabels) label.position.copy(body.position);
      }
    }
  });

  // Dev-only debug handle for tuning/verifying the sim from the console.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    (window as unknown as { __sim?: unknown }).__sim = {
      bodies,
      rMin,
      getRMax: () => rMax.current,
      store: useSpace,
    };
  }, [bodies, rMin]);

  return (
    <>
      {/* decay 0 = uniform "astrophoto exposure" across the whole band, and it
          keeps lit planet surfaces below the bloom threshold (sun-only bloom). */}
      <pointLight position={[0, 0, 0]} intensity={2.3} decay={0} color="#ffe6bf" />
      {bodies.map((body, i) => (
        <Planet
          key={body.id}
          body={body}
          isStar={i === 0}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
          onGrab={() => handleGrab(i)}
          onSelect={i === 0 ? goHome : () => dock(body.id)}
        />
      ))}
      {bodies.map((body, i) => (
        <PlanetLabel
          key={`label-${body.id}`}
          body={body}
          // The star dwarfs the planets — shrink its HOME label to clear the
          // orbits, and space the letters out so HOME doesn't crowd itself.
          sizeFactor={i === 0 ? 0.42 : undefined}
          charAdvance={i === 0 ? 0.95 : undefined}
          ref={(el) => {
            labelRefs.current[i] = el;
          }}
        />
      ))}
    </>
  );
}
