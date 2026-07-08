"use client";

import { useSpace } from "@/lib/store";
import { PROJECTS_BY_RANK } from "@/lib/system-config";

/**
 * The technical directory — reached from a project page (the camera drifts out
 * into empty space) and rendered over the bare starfield. It lists every
 * project best-to-worst with its high-level technical concepts and the tech
 * chips, so the whole body of work reads as one categorized index. A dark scrim
 * keeps the text legible while the stars still show through behind it.
 */
export default function DirectoryOverlay() {
  const closeDirectory = useSpace((s) => s.closeDirectory);

  return (
    <div className="fade-in absolute inset-0 z-10 overflow-y-auto bg-gradient-to-b from-black/70 via-black/55 to-black/75">
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-6 py-8 md:px-10 md:py-14">
        <button
          id="btn-directory-back"
          onClick={closeDirectory}
          className="self-start cursor-pointer font-mono text-xs uppercase tracking-[0.3em] text-white/75 transition-colors hover:text-white"
        >
          ← back to the system
        </button>

        <header className="mt-10 md:mt-14">
          <h1 className="text-4xl font-semibold text-white md:text-6xl">Technical Directory</h1>
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.35em] text-white/55">
            every project · concepts &amp; stack · best to last
          </p>
        </header>

        <ol className="mt-12 flex flex-col">
          {PROJECTS_BY_RANK.map((def, i) => (
            <li
              key={def.id}
              className="border-t border-white/10 py-8 first:border-t-0 md:py-10"
            >
              <div className="flex items-baseline gap-4">
                <span
                  className="font-mono text-sm font-bold tabular-nums"
                  style={{ color: def.color }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2 className="text-2xl font-semibold text-white md:text-3xl">{def.name}</h2>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.3em] text-white/50">
                    {def.tagline}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-5 pl-8 sm:grid-cols-[auto_1fr] sm:gap-x-8">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40 sm:pt-1">
                  concepts
                </span>
                <ul className="flex flex-wrap gap-2">
                  {def.concepts.map((c) => (
                    <li
                      key={c}
                      className="rounded-full bg-white/10 px-3 py-1 font-mono text-xs text-white/90"
                    >
                      {c}
                    </li>
                  ))}
                </ul>

                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40 sm:pt-1">
                  stack
                </span>
                <ul className="flex flex-wrap gap-2">
                  {def.tech.map((t) => (
                    <li
                      key={t}
                      className="rounded-full border border-white/30 px-3 py-1 font-mono text-xs text-white/80"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
