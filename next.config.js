module.exports = {
  env: {
    commitTag: process.env.COMMIT_TAG || 'local',
    BASE_PATH: process.env.BASE_PATH,
  },
  basePath: process.env.BASE_PATH,
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
};
