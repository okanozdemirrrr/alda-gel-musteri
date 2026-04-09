/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['images.unsplash.com'],
    unoptimized: true, // Static export için gerekli
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  trailingSlash: false,
  // TypeScript ve ESLint hatalarını ignore etme (production build için)
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
