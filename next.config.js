module.exports = {
  env: {
    commitTag: process.env.COMMIT_TAG || 'local',
  },
  images: {
    domains: ['image.tmdb.org'],
  },
  future: {
    webpack5: true,
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      issuer: /\.(js|ts)x?$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
};
