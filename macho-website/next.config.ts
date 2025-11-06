import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.env.VERCEL ? __dirname : path.join(__dirname, "../"),
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
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "machoda.com",
          },
        ],
        destination: "https://www.machoda.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
