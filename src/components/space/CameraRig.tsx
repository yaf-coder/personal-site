"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from "three";
import type { Body } from "@/lib/physics";
import { STAR_RADIUS, SYSTEM_CAMERA_POSITION } from "@/lib/system-config";
import { useSpace } from "@/lib/store";

/** Unit vector from the sun toward the system-overview camera: the zoom axis. */
const ZOOM_AXIS = SYSTEM_CAMERA_POSITION.clone().normalize();

/**
 * Distance at which a sphere of `radius` overfills the viewport in BOTH axes
 * (so no stars peek at the edges): the sphere's angular radius must beat the
 * larger of the vertical/horizontal half-fovs, divided by an overfill margin.
 */
function fillDistance(cam: THREE.PerspectiveCamera, radius: number, overfill: number): number {
  const v = THREE.MathUtils.degToRad(cam.fov) / 2;
  const h = Math.atan(Math.tan(v) * cam.aspect);
  const fit = radius / Math.sin(Math.max(v, h)) / overfill;
  // Guard: on wide viewports the overfill math can demand a distance smaller
  // than the radius, which would put the camera *inside* the sphere (front
  // faces cull -> you see straight through it). Never get closer than a safe
  // margin outside the surface; that near view still overfills the screen.
  return Math.max(fit, radius * SAFE_DISTANCE_FACTOR);
}

/** Minimum camera distance as a multiple of a body's radius (keeps it outside). */
const SAFE_DISTANCE_FACTOR = 1.2;

/**
 * Overfill margins. The sun's is generous so the home close-up camera sits well
 * inside the innermost orbit (planets must never sweep through the lens).
 */
const SUN_OVERFILL = 1.45;
const PLANET_OVERFILL = 1.25;

/** Camera pose for standing on the sun, given the current aspect. */
function sunPose(cam: THREE.PerspectiveCamera): THREE.Vector3 {
  return ZOOM_AXIS.clone().multiplyScalar(fillDistance(cam, STAR_RADIUS, SUN_OVERFILL));
}

/**
 * Executes camera flights for the navigation state machine: reads `transition`
 * from the store, tweens position + look-target with GSAP, then commits the
 * new view. Zoom-in is literally the zoom-out path reversed (same axis, same
 * easing).
 */
export default function CameraRig({ bodies }: { bodies: Body[] }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const look = useRef(new THREE.Vector3(0, 0, 0));
  const transition = useSpace((s) => s.transition);

  // Park on the sun before first paint; re-fit on resize while parked there.
  useLayoutEffect(() => {
    const { view, transition: t } = useSpace.getState();
    if (view === "sun" && !t) {
      camera.position.copy(sunPose(camera));
      look.current.set(0, 0, 0);
      camera.lookAt(look.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height]);

  useEffect(() => {
    if (!transition) return;

    const toPos = new THREE.Vector3();
    const toLook = new THREE.Vector3(0, 0, 0);
    let duration = 2.2;

    switch (transition.kind) {
      case "sun-to-system":
        toPos.copy(SYSTEM_CAMERA_POSITION);
        break;
      case "system-to-sun":
        toPos.copy(sunPose(camera));
        break;
      case "dock": {
        const body = bodies.find((b) => b.id === transition.id);
        if (!body) {
          useSpace.getState().commitTransition();
          return;
        }
        // Approach along the current sight-line so the dive feels continuous.
        const dir = camera.position.clone().sub(body.position).normalize();
        toPos
          .copy(body.position)
          .addScaledVector(dir, fillDistance(camera, body.radius, PLANET_OVERFILL));
        toLook.copy(body.position);
        duration = 1.8;
        break;
      }
      case "undock":
        toPos.copy(SYSTEM_CAMERA_POSITION);
        duration = 1.8;
        break;
    }

    const tl = gsap.timeline({
      defaults: { duration, ease: "power2.inOut" },
      onUpdate: () => camera.lookAt(look.current),
      onComplete: () => useSpace.getState().commitTransition(),
    });
    tl.to(camera.position, { x: toPos.x, y: toPos.y, z: toPos.z }, 0);
    tl.to(look.current, { x: toLook.x, y: toLook.y, z: toLook.z }, 0);

    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transition]);

  return null;
}
