import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    unoptimized: true, // For static assets
    domains: ['localhost'],
  },
};

export default nextConfig;
