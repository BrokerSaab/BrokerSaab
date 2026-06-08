/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  experimental: {
    optimizePackageImports: ['lucide-react', '@tanstack/react-query'],
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    remotePatterns: [
      // Allow Render-hosted /uploads/kyc/* paths proxied through Next.js
      { protocol: 'https', hostname: '**' },
    ],
  },

  compress: true,

  logging: { fetches: { fullUrl: false } },

  // Proxy all /api/v1/* calls through Next.js to avoid CORS in production.
  // Set BACKEND_URL in Vercel env vars (no NEXT_PUBLIC_ prefix — server-side only).
  async rewrites() {
    const backend = process.env.BACKEND_URL || 'http://localhost:5000';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backend}/api/v1/:path*`,
      },
      // Also proxy /uploads (advisor photos served from backend)
      {
        source: '/uploads/:path*',
        destination: `${backend}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
