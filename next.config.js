/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  reactStrictMode: true,
  staticPageGenerationTimeout: 300,
  experimental: {
    webpackMemoryOptimizations: true,
  },
  turbopack: {},
};

module.exports = withPWA(nextConfig);
