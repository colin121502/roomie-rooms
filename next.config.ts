import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // ✅ Ensure the project root is correct so middleware + env vars load properly
    root: __dirname,
  },
  reactStrictMode: true,
};

export default nextConfig;