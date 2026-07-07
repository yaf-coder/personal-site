import SceneClient from "@/components/space/SceneClient";

export default function Home() {
  return (
    <main className="fixed inset-0 h-full w-full overflow-hidden bg-[#05060a]">
      <SceneClient />

      <div className="pointer-events-none absolute inset-x-0 top-0 p-6 md:p-10">
        <h1 className="font-mono text-sm uppercase tracking-[0.3em] text-white/70">
          Your Name
        </h1>
        <p className="mt-2 font-mono text-xs text-white/40">
          Full-stack engineer — grab a planet and give it a shove
        </p>
      </div>
    </main>
  );
}
