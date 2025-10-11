import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../"),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.microcms-assets.io",
        pathname: "/assets/**",
      },
      {
        protocol: "https",
        hostname: "macho.microcms.io",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
