"use client";

import { useSpace } from "@/lib/store";
import HomeOverlay from "./HomeOverlay";
import ProjectOverlay from "./ProjectOverlay";

/**
 * Switches the DOM layer by navigation state. During camera flights nothing is
 * rendered — the transition plays clean and full-screen overlays (which also
 * block canvas pointer events) only exist while settled in a view.
 */
export default function Overlays() {
  const view = useSpace((s) => s.view);
  const transition = useSpace((s) => s.transition);

  if (transition) return null;
  if (view === "sun") return <HomeOverlay />;
  if (view === "planet") return <ProjectOverlay />;

  return (
    <div className="fade-in pointer-events-none absolute inset-x-0 top-0 z-10 p-6 md:p-10">
      <h1 className="font-mono text-sm uppercase tracking-[0.3em] text-white/70">Your Name</h1>
      <p className="mt-2 font-mono text-xs text-white/40">
        hover to pause · click a planet to visit · drag to fling · click the sun to go home
      </p>
    </div>
  );
}
