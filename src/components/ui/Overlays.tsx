"use client";

import { useSpace } from "@/lib/store";
import HomeOverlay from "./HomeOverlay";
import ProjectOverlay from "./ProjectOverlay";
import DirectoryOverlay from "./DirectoryOverlay";

/**
 * Switches the DOM layer by navigation state. During camera flights nothing is
 * rendered — the transition plays clean and full-screen overlays (which also
 * block canvas pointer events) only exist while settled in a view.
 */
export default function Overlays() {
  const view = useSpace((s) => s.view);
  const transition = useSpace((s) => s.transition);
  const openDirectory = useSpace((s) => s.openDirectory);

  if (transition) return null;
  if (view === "sun") return <HomeOverlay />;
  if (view === "planet") return <ProjectOverlay />;
  if (view === "directory") return <DirectoryOverlay />;

  // Solar-system view: a top hint plus the gateway to the technical directory.
  return (
    <>
      <div className="fade-in pointer-events-none absolute inset-x-0 top-0 z-10 p-6 md:p-10">
        <h1 className="font-mono text-base font-bold uppercase tracking-[0.3em] text-white">
          Yafee Khan
        </h1>
        <p className="mt-2 font-mono text-xs text-white/55">
          hover to pause · click a planet to visit · drag to fling · click the sun to go home
        </p>
      </div>
      <button
        id="btn-directory"
        onClick={openDirectory}
        className="fade-in group absolute bottom-0 left-0 z-10 m-6 flex cursor-pointer items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-white/70 transition-colors hover:text-white md:m-10"
      >
        technical directory
        <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
          →
        </span>
      </button>
    </>
  );
}
