import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    localPatterns: [{ pathname: "/uploads/**" }],
  },
};

export default nextConfig;
