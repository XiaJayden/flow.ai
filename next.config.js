/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Server external packages
  serverExternalPackages: [
    '@libsql/client',
    '@prisma/adapter-libsql',
    'libsql'
  ],
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Only apply these fixes for server-side builds
    if (isServer) {
      // Externalize libSQL packages for server-side
      config.externals = config.externals || []
      config.externals.push({
        '@libsql/client': '@libsql/client',
        '@prisma/adapter-libsql': '@prisma/adapter-libsql',
        'libsql': 'libsql'
      })
    } else {
      // For client-side, completely ignore these server-only packages
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@libsql/client': false,
        '@prisma/adapter-libsql': false,
        'libsql': false,
        'fs': false,
        'net': false,
        'tls': false,
      }
    }

    return config
  },
}

module.exports = nextConfig