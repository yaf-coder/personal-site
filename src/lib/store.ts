"use client";

import { create } from "zustand";

/**
 * Navigation state machine. The site is organized by camera depth:
 *
 *   sun (home) <--zoom--> system (playground) <--zoom--> planet (project page)
 *
 * `view` is the settled location; `transition` is non-null while the camera is
 * flying between views (CameraRig runs the flight and calls commitTransition).
 * All actions are guarded so invalid moves (e.g. docking mid-flight) no-op.
 */
export type View = "sun" | "system" | "planet";

export type Transition =
  | { kind: "sun-to-system" }
  | { kind: "system-to-sun" }
  | { kind: "dock"; id: string }
  | { kind: "undock" };

interface SpaceState {
  view: View;
  transition: Transition | null;
  /** Planet under the pointer (system view only) — frozen in place. */
  hoveredId: string | null;
  /** Planet being visited — frozen so the camera can hold on it. */
  focusedId: string | null;
  goToSystem: () => void;
  goHome: () => void;
  dock: (id: string) => void;
  undock: () => void;
  setHovered: (id: string | null) => void;
  commitTransition: () => void;
}

export const useSpace = create<SpaceState>((set, get) => ({
  view: "sun",
  transition: null,
  hoveredId: null,
  focusedId: null,

  goToSystem: () => {
    const { view, transition } = get();
    if (view !== "sun" || transition) return;
    set({ transition: { kind: "sun-to-system" } });
  },

  goHome: () => {
    const { view, transition } = get();
    if (view !== "system" || transition) return;
    set({ transition: { kind: "system-to-sun" }, hoveredId: null });
  },

  dock: (id) => {
    const { view, transition } = get();
    if (view !== "system" || transition) return;
    set({ transition: { kind: "dock", id }, focusedId: id, hoveredId: null });
  },

  undock: () => {
    const { view, transition } = get();
    if (view !== "planet" || transition) return;
    set({ transition: { kind: "undock" } });
  },

  setHovered: (id) => {
    const { view, transition } = get();
    // Always allow clearing; only allow setting while idle in the system view.
    if (id !== null && (view !== "system" || transition)) return;
    set({ hoveredId: id });
  },

  commitTransition: () => {
    const t = get().transition;
    if (!t) return;
    switch (t.kind) {
      case "sun-to-system":
      case "undock":
        set({ view: "system", transition: null, focusedId: null });
        break;
      case "system-to-sun":
        set({ view: "sun", transition: null });
        break;
      case "dock":
        set({ view: "planet", transition: null });
        break;
    }
  },
}));
