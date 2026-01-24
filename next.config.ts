import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "pino",
    "thread-stream",
    "pino-pretty",
    "lokijs",
    "encoding",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "zunokit.github.io",
        port: "",
        pathname: "/zuno-marketplace-assets/**",
      },
    ],
  },
};

export default nextConfig;
