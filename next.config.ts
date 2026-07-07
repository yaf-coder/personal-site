import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a fully static site into ./out for GitHub Pages (no Node server).
  output: "export",
  // GitHub Pages serves each route as a folder (/credits/ -> credits/index.html).
  trailingSlash: true,
  // The <Image> optimizer needs a server; disable it for static hosting.
  images: { unoptimized: true },
};

export default nextConfig;
