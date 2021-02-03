import { existsSync } from 'fs';
import path from 'path';

const DOCKER_PATH = path.join(__dirname, '../../config/DOCKER');

export const appDataStatus = (): boolean => {
  return !existsSync(DOCKER_PATH);
};
