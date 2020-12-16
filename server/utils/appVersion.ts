export const getAppVersion = (): string => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { version } = require('../../package.json');

  let finalVersion = version;

  if (version === '0.1.0') {
    finalVersion = `develop-${process.env.COMMIT_TAG ?? 'local'}`;
  }

  return finalVersion;
};
