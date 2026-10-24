import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const paths = ['/dashboard', '/application-tracker', '/my-profile', '/settings', '/auth', '/admin', '/api', '/dev', '/legal'];
    const rules = paths.map(path => ({ source: `${path}/:path*`, headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, nosnippet' }] }));
    if (process.env.VERCEL_ENV === 'preview') rules.push({ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, nosnippet' }] });
    return rules;
  },
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
