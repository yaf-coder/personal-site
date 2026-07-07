"use client";

import { useSpace } from "@/lib/store";

/**
 * The homepage — rendered while standing on the sun (the star fills the
 * viewport behind this). Dark text on the sun's surface color.
 */
export default function HomeOverlay() {
  const goToSystem = useSpace((s) => s.goToSystem);

  return (
    <div className="fade-in absolute inset-0 z-10 flex flex-col justify-between p-8 text-[#3a2508] md:p-14">
      <header>
        <h1 className="font-mono text-lg uppercase tracking-[0.35em] md:text-xl">
          Your Name
        </h1>
        <p className="mt-2 font-mono text-xs opacity-70 md:text-sm">
          full-stack engineer · this site runs on gravity
        </p>
      </header>

      <nav className="flex flex-col items-start gap-3 md:gap-4">
        <button
          id="nav-projects"
          onClick={goToSystem}
          className="group cursor-pointer font-sans text-4xl font-semibold uppercase tracking-wide transition-all duration-300 hover:tracking-widest md:text-6xl"
        >
          Projects
          <span className="ml-3 inline-block transition-transform duration-300 group-hover:translate-x-2">
            →
          </span>
        </button>
        <button
          className="cursor-not-allowed font-sans text-4xl font-semibold uppercase tracking-wide opacity-35 md:text-6xl"
          title="coming soon"
        >
          Education
        </button>
        <button
          className="cursor-not-allowed font-sans text-4xl font-semibold uppercase tracking-wide opacity-35 md:text-6xl"
          title="coming soon"
        >
          About
        </button>

        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.35em] opacity-60">
          you are standing on the sun
        </p>
      </nav>
    </div>
  );
}
