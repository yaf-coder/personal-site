import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Credits & Attributions",
  description: "Everything this corner of space is built on.",
};

const linkCls =
  "underline decoration-dotted underline-offset-4 hover:text-white transition-colors";

const OPEN_SOURCE: { name: string; href: string; role: string }[] = [
  { name: "Next.js", href: "https://nextjs.org", role: "framework" },
  { name: "React", href: "https://react.dev", role: "UI" },
  { name: "three.js", href: "https://threejs.org", role: "3D engine" },
  {
    name: "React Three Fiber + drei",
    href: "https://github.com/pmndrs/react-three-fiber",
    role: "React renderer for three.js",
  },
  {
    name: "postprocessing",
    href: "https://github.com/pmndrs/postprocessing",
    role: "bloom, grain, vignette",
  },
  { name: "GSAP", href: "https://gsap.com", role: "camera choreography" },
  { name: "Zustand", href: "https://github.com/pmndrs/zustand", role: "state" },
  { name: "Tailwind CSS", href: "https://tailwindcss.com", role: "styling" },
  { name: "Geist", href: "https://vercel.com/font", role: "type family" },
];

/**
 * Static credits page. The global <body> is overflow-hidden (the 3D pages own
 * their scroll), so this page scrolls internally.
 */
export default function CreditsPage() {
  return (
    <main className="h-dvh overflow-y-auto bg-[#05060a] text-white">
      <div className="mx-auto max-w-2xl px-8 py-16 md:px-0 md:py-24">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-[0.3em] text-white/60 transition-colors hover:text-white"
        >
          ← back to the sun
        </Link>

        <h1 className="mt-10 text-4xl font-semibold md:text-5xl">
          Credits &amp; attributions
        </h1>
        <p className="mt-4 text-white/70">Everything this corner of space is built on.</p>

        <section>
          <h2 className="mt-14 font-mono text-xs uppercase tracking-[0.35em] text-white/50">
            Imagery
          </h2>
          <p className="mt-4 leading-relaxed text-white/85">
            Surface maps of the Sun, Mars, Neptune, Venus, Jupiter and Uranus, and the
            Milky Way panorama, by{" "}
            <a
              href="https://www.solarsystemscope.com/textures/"
              target="_blank"
              rel="noreferrer"
              className={linkCls}
            >
              Solar System Scope
            </a>
            , licensed under{" "}
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noreferrer"
              className={linkCls}
            >
              CC BY 4.0
            </a>
            . Based on NASA elevation and imagery data.
          </p>
        </section>

        <section>
          <h2 className="mt-14 font-mono text-xs uppercase tracking-[0.35em] text-white/50">
            Open source
          </h2>
          <ul className="mt-4 space-y-2 text-white/85">
            {OPEN_SOURCE.map((d) => (
              <li key={d.name} className="flex items-baseline gap-3">
                <a href={d.href} target="_blank" rel="noreferrer" className={linkCls}>
                  {d.name}
                </a>
                <span className="font-mono text-xs text-white/45">{d.role}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mt-14 font-mono text-xs uppercase tracking-[0.35em] text-white/50">
            Physics
          </h2>
          <p className="mt-4 leading-relaxed text-white/85">
            The orbits run on a velocity-Verlet n-body integrator written by hand for
            this site — no physics library. Gravity © Isaac Newton, 1687. Public domain.
          </p>
        </section>

        <p className="mt-16 font-mono text-[10px] uppercase tracking-[0.3em] text-white/35">
          © {new Date().getFullYear()} Yafee Khan
        </p>
      </div>
    </main>
  );
}
