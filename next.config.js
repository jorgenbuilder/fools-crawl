const withPWA = require("next-pwa")({
  dest: "public",
});

/** @type {import('next').NextConfig} */
const nextConfig = withPWA({
  reactStrictMode: true,
  swcMinify: true,
  pwa: {
    dest: "public",
    register: true,
    skipWaiting: true,
    swSrc: "service-worker.js",
  },
  experimental: {
    externalDir: true,
  },
});

module.exports = nextConfig;
