/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tree-shake lucide-react — bundles only the icons actually imported
  // (without this, the full 1000+ icon library is included in the bundle)
  experimental: {
    optimizePackageImports: ['lucide-react', '@tanstack/react-query'],
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Compress responses
  compress: true,

  // Reduce build output noise
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default nextConfig;
