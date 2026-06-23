import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: false, // Enable PWA in dev mode for Push Notifications
  register: true,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
  },
});

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/productions/:slug*',
        destination: '/shows/:slug*',
        permanent: true,
      },
      {
        source: '/events/:slug*',
        destination: '/event/:slug*',
        permanent: true,
      },
      {
        source: '/discovery',
        destination: '/tickets',
        permanent: false,
      },
    ];
  },
};

export default withPWA(nextConfig);
