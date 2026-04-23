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
      {
        protocol: "https",
        hostname: "thumbnail.image.rakuten.co.jp",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "hbb.afl.rakuten.co.jp",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "image.rakuten.co.jp",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "shop.r10s.jp",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "fitnessshop.jp",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "fitnessshop.jp",
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
