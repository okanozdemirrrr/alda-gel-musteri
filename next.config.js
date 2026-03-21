/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['images.unsplash.com'],
    unoptimized: true,
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Vercel için output ayarı
  output: 'standalone',
  // Tüm sayfaları export et
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
