import { QualityProfile, RootFolder, Tag } from '../../api/servarr/base';
import { LanguageProfile } from '../../api/servarr/sonarr';

export interface ServiceCommonServer {
  id: number;
  name: string;
  is4k: boolean;
  isDefault: boolean;
  activeProfileId: number;
  activeDirectory: string;
  activeLanguageProfileId?: number;
  activeAnimeProfileId?: number;
  activeAnimeDirectory?: string;
  activeAnimeLanguageProfileId?: number;
  activeTags: number[];
  activeAnimeTags?: number[];
}

export interface ServiceCommonServerWithDetails {
  server: ServiceCommonServer;
  profiles: QualityProfile[];
  rootFolders: Partial<RootFolder>[];
  languageProfiles?: LanguageProfile[];
  tags: Tag[];
}
