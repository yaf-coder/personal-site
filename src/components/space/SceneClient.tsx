"use client";

import dynamic from "next/dynamic";

const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center bg-[#05060a]">
      <p className="font-mono text-xs tracking-[0.3em] text-white/40 uppercase">
        entering orbit…
      </p>
    </div>
  ),
});

export default function SceneClient() {
  return <Scene />;
}
