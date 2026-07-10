"use client";

import { useState } from "react";
import Link from "next/link";
import { useSpace } from "@/lib/store";

const ABOUT_PARAGRAPHS = [
  "I'm Yafee Khan, a Yale undergraduate studying Computer Science and Physics, working across three interlocking disciplines: data science, applied AI, and algorithm design. I work primarily in Python and Rust, and I'm drawn to problems that don't fit neatly into one of these boxes — where a statistical question needs an algorithmic solution, or an AI system needs to be built on a foundation of rigorous data engineering.",
  "On the data science side, my background includes generating and validating datasets, training and evaluating models, and grounding results in careful statistical analysis rather than surface-level metrics. On the applied AI side, I've built agent architectures, simulation systems, and full-stack tools that turn models into working products. And underlying all of it is a deep interest in algorithms and data structures — the kind of low-level, first-principles thinking that makes both the statistics and the systems actually scale.",
  "Beyond the technical side, I'm curious about markets, physics, and the patterns — statistical or otherwise — that show up in both. When I'm not building or learning, you can usually find me playing tennis, watching movies, or overthinking both with the same intensity I bring to a dataset.",
];

/**
 * The homepage — rendered while standing on the sun (the star fills the
 * viewport behind this). Dark text on the sun's surface color. The overlay
 * scrolls: the first screen holds the menu, and sinking below the fold reveals
 * the colophon with the credits link.
 */
export default function HomeOverlay() {
  const goToSystem = useSpace((s) => s.goToSystem);
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <div id="home-scroll" className="fade-in absolute inset-0 z-10 overflow-y-auto">
      {/* Screen 1: the menu. */}
      <section className="flex min-h-full flex-col justify-between p-8 text-[#3a2508] md:p-14">
        <header>
          <h1 className="font-mono text-4xl font-bold uppercase tracking-tight md:text-6xl">
            Yafee Khan
          </h1>
          <p className="mt-2 font-mono text-xs opacity-70 md:text-sm">
            full-stack engineer · CS + Physics @ Yale · this site runs on gravity
          </p>
        </header>

        {/* Printed-photo cluster in the middle blank space: the child portrait
            on the left, on top; the formal portrait behind. */}
        <div className="pointer-events-none flex justify-center py-6">
          <div className="flex w-full max-w-lg items-center justify-center">
            {/* Child — portrait, on top, left, slight overlap. */}
            <div className="relative z-10 -mr-[4%] w-[38%] shrink-0 -rotate-2 bg-white p-2 shadow-2xl shadow-black/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/photos/child.jpg"
                alt="Yafee as a kid"
                className="block w-full"
              />
            </div>
            {/* Formal portrait, behind — width tuned so its height matches the child. */}
            <div className="w-[51%] shrink-0 rotate-2 bg-white p-2 shadow-2xl shadow-black/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/photos/formal.jpg"
                alt="Yafee dressed up"
                className="block w-full"
              />
            </div>
          </div>
        </div>

        <nav className="flex flex-col items-start gap-3 md:gap-4">
          <div className="w-full">
            <button
              onClick={() => setAboutOpen((o) => !o)}
              aria-expanded={aboutOpen}
              className="group flex cursor-pointer items-center gap-3 font-sans text-4xl font-semibold uppercase tracking-wide transition-all duration-300 hover:tracking-widest md:text-6xl"
            >
              About
              <span
                className={`inline-block text-2xl transition-transform duration-300 md:text-3xl ${
                  aboutOpen ? "rotate-180" : ""
                }`}
                aria-hidden
              >
                ▾
              </span>
            </button>
            {aboutOpen && (
              <div className="fade-in mt-5 max-w-xl space-y-3 font-sans text-sm leading-relaxed opacity-80 md:text-base">
                {ABOUT_PARAGRAPHS.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            )}
          </div>
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
          <a
            id="nav-resume"
            href="/Yafee_Khan_Resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="group cursor-pointer font-sans text-4xl font-semibold uppercase tracking-wide transition-all duration-300 hover:tracking-widest md:text-6xl"
          >
            Resume
            <span className="ml-3 inline-block transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1">
              ↗
            </span>
          </a>

          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.35em] opacity-60">
            you are standing on the sun
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] opacity-40">
            ↓ more below the surface
          </p>
        </nav>
      </section>

      {/* Below the fold: the colophon. */}
      <section className="flex min-h-[55vh] flex-col items-start justify-end gap-4 p-8 pb-16 text-[#3a2508] md:p-14 md:pb-20">
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] opacity-60">
          colophon
        </p>
        <Link
          id="nav-credits"
          href="/credits"
          className="group font-sans text-2xl font-semibold uppercase tracking-wide transition-all duration-300 hover:tracking-widest md:text-3xl"
        >
          Credits &amp; attributions
          <span className="ml-3 inline-block transition-transform duration-300 group-hover:translate-x-2">
            →
          </span>
        </Link>
        <p className="font-mono text-[10px] tracking-wider opacity-45">
          © {new Date().getFullYear()} Yafee Khan · built on gravity, textures, and open
          source
        </p>
      </section>
    </div>
  );
}
