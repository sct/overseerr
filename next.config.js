/**
 * @type {import('next').NextConfig}
 */
module.exports = {
  env: {
    commitTag: process.env.COMMIT_TAG || 'local',
  },
  async redirects() {
    return [
      {
        source: '/discover/artists',
        destination: '/discover/music',
        permanent: true,
      },
      {
        source: '/discover/albums',
        destination: '/discover/music',
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
      },
    ],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      issuer: /\.(js|ts)x?$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
  // scrollRestoration is now built-in, no longer experimental
  // largePageDataBytes removed in Next.js 13
};
