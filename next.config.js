/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // ESLint hatalarını derleme sırasında görmezden gel
    ignoreDuringBuilds: true,
  },
};

module.exports = withPWA(nextConfig); 