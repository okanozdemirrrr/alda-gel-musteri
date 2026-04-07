/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['images.unsplash.com'],
    unoptimized: true, // Capacitor için gerekli
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Capacitor için export (Vercel deploy için kapalı)
  // output: 'export',
  // distDir: 'out',
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
