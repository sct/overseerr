import type { RadarrSettings } from '@server/lib/settings';

export const selectDefaultRadarrServer = (
  radarrServers: RadarrSettings[],
  {
    is4k,
    isAnime,
  }: {
    is4k: boolean;
    isAnime: boolean;
  }
): RadarrSettings | undefined => {
  const matchingServer = radarrServers.find(
    (server) =>
      server.isDefault &&
      server.is4k === is4k &&
      (server.isAnime ?? false) === isAnime
  );

  if (matchingServer) {
    return matchingServer;
  }

  if (!isAnime) {
    return undefined;
  }

  return radarrServers.find(
    (server) =>
      server.isDefault &&
      server.is4k === is4k &&
      !(server.isAnime ?? false)
  );
};

export default selectDefaultRadarrServer;
