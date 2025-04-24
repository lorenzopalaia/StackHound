import type { NextConfig } from "next";

const HSTS_MAX_AGE = 31536000; // 1 year in seconds
const HSTS_HEADER = `max-age=${HSTS_MAX_AGE}; includeSubDomains; preload`;

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: HSTS_HEADER,
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
