import { RadarrProfile, RadarrRootFolder } from '../../api/radarr';

export interface ServiceCommonServer {
  id: number;
  name: string;
  is4k: boolean;
  isDefault: boolean;
  activeProfileId: number;
  activeDirectory: string;
  activeAnimeProfileId?: number;
  activeAnimeDirectory?: string;
}

export interface ServiceCommonServerWithDetails {
  server: ServiceCommonServer;
  profiles: RadarrProfile[];
  rootFolders: Partial<RadarrRootFolder>[];
}
