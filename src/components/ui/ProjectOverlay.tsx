"use client";

import { useSpace } from "@/lib/store";
import { PLANET_DEFS } from "@/lib/system-config";

/**
 * The project page — a planet-colored screen shown once the camera has docked.
 * A dark gradient sits over the planet color for text contrast.
 */
export default function ProjectOverlay() {
  const focusedId = useSpace((s) => s.focusedId);
  const undock = useSpace((s) => s.undock);
  const def = PLANET_DEFS.find((p) => p.id === focusedId);
  if (!def) return null;

  return (
    <div
      className="fade-in absolute inset-0 z-10 overflow-y-auto"
      style={{ backgroundColor: def.color }}
    >
      <div className="flex min-h-full flex-col bg-gradient-to-b from-black/55 via-black/35 to-black/65 p-8 md:p-14">
        <button
          id="btn-back"
          onClick={undock}
          className="self-start cursor-pointer font-mono text-xs uppercase tracking-[0.3em] text-white/75 transition-colors hover:text-white"
        >
          ← back to the system
        </button>

        <div className="my-auto max-w-2xl py-12">
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-white/60">
            {def.tagline}
          </p>
          <h2 className="mt-3 text-4xl font-semibold text-white md:text-6xl">{def.name}</h2>
          <p className="mt-6 leading-relaxed text-white/85">{def.blurb}</p>
          <ul className="mt-8 flex flex-wrap gap-2">
            {def.tech.map((t) => (
              <li
                key={t}
                className="rounded-full border border-white/30 px-3 py-1 font-mono text-xs text-white/85"
              >
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
