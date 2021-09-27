export const getPath = (url: string): string => {
  const basePath = process.env.BASE_PATH;
  return `${basePath || ''}/api/v1${url}`;
};

export const getUiPath = (url: string): string => {
  const basePath = process.env.BASE_PATH;
  return `${basePath || ''}${url}`;
};
