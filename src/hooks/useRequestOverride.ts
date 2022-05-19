import useSWR from 'swr';
import { MediaRequest } from '../../server/entity/MediaRequest';
import { ServiceCommonServer } from '../../server/interfaces/api/serviceInterfaces';

interface OverrideStatus {
  server: string | null;
  profile: number | null;
  rootFolder: string | null;
  languageProfile: number | null;
}

const useRequestOverride = (request: MediaRequest): OverrideStatus => {
  const { data } = useSWR<ServiceCommonServer[]>(
    `/api/v1/service/${request.type === 'movie' ? 'radarr' : 'sonarr'}`
  );

  if (!data) {
    return {
      server: null,
      profile: null,
      rootFolder: null,
      languageProfile: null,
    };
  }

  const defaultServer = data.find(
    (server) => server.is4k === request.is4k && server.isDefault
  );

  const activeServer = data.find((server) => server.id === request.serverId);

  return {
    server:
      activeServer && request.serverId !== defaultServer?.id
        ? activeServer.name
        : null,
    profile:
      defaultServer?.activeProfileId !== request.profileId
        ? request.profileId
        : null,
    rootFolder:
      defaultServer?.activeDirectory !== request.rootFolder
        ? request.rootFolder
        : null,
    languageProfile:
      request.type === 'tv' &&
      defaultServer?.activeLanguageProfileId !== request.languageProfileId
        ? request.languageProfileId
        : null,
  };
};

export default useRequestOverride;
