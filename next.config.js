module.exports = {
  env: {
    commitTag: process.env.COMMIT_TAG || 'local',
  },
  images: {
    domains: ['image.tmdb.org'],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      issuer: /\.(js|ts)x?$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
  // This rewrite section is required at build time or the client rewrite code needed for base url patch in _app gets
  // optimised out of the build or the following needs to be put in the webpack customizer
  // config.optimization.minimize = false;
  rewrites: async () => ({
    beforeFiles: [
      {
        source: '/index',
        destination: '/',
      },
    ],
  }),
};
