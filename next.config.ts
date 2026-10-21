import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-lib", "sharp"],
  // The PDF parser is loaded inside a fixed worker script. Include its runtime
  // files explicitly so Vercel's file tracing cannot omit that dependency.
  outputFileTracingIncludes: {
    "/api/documents": ["./node_modules/pdf-lib/**/*", "./node_modules/@pdf-lib/**/*", "./node_modules/pako/**/*", "./node_modules/tslib/**/*"],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'randomuser.me',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
