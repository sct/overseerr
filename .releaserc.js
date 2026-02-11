module.exports = {
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
      },
    ],
    '@semantic-release/npm',
    [
      '@semantic-release/git',
      {
        assets: ['package.json', 'CHANGELOG.md'],
        message: 'chore(release): ${nextRelease.version}',
      },
    ],
    [
      'semantic-release-docker-buildx',
      {
        buildArgs: {
          COMMIT_TAG: '$GIT_SHA',
        },
        imageNames: [
          `${process.env.DOCKER_USERNAME || 'ComicalHysteria'}/overseerr`,
          `ghcr.io/${process.env.GITHUB_REPOSITORY_OWNER || 'ComicalHysteria'}/overseerr`,
        ],
        platforms: ['linux/amd64', 'linux/arm64', 'linux/arm/v7'],
      },
    ],
    [
      '@semantic-release/github',
      {
        addReleases: 'bottom',
      },
    ],
  ],
  branches: ['master'],
  npmPublish: false,
};
