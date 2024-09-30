import LidarrAPI from '@server/api/servarr/lidarr';
import { getSettings } from '@server/lib/settings';
import type { mbArtist, mbRelease, mbReleaseGroup } from './interfaces';

async function getPosterFromMB(
  element: mbRelease | mbReleaseGroup | mbArtist
): Promise<string | undefined> {
  if (element.media_type === 'artist') {
    const settings = getSettings();
    const lidarrSettings = settings.lidarr.find((lidarr) => lidarr.isDefault);
    if (!lidarrSettings) {
      throw new Error('No default Lidarr instance found');
    }
    const lidarr: LidarrAPI = new LidarrAPI({
      apiKey: lidarrSettings.apiKey,
      url: LidarrAPI.buildUrl(lidarrSettings, '/api/v1'),
    });
    try {
      const artist = await (lidarr as LidarrAPI).getArtist(element.id);
      if (artist.images.find((i) => i.coverType === 'poster')?.url) {
        const posterUrl = artist.images.find(
          (i) => i.coverType === 'poster'
        )?.url;
        if (posterUrl?.startsWith('/MediaCover/') || artist.id !== undefined) {
          return `/imageproxy/lidarr?artistId=${artist.id}`;
        } else if (posterUrl?.startsWith('/MediaCoverProxy/')) {
          return undefined;
        } else {
          return posterUrl;
        }
      }
    } catch (e) {
      return undefined;
    }
  }
  return `https://coverartarchive.org/${element.media_type}/${element.id}/front-250.jpg`;
}

async function getFanartFromMB(element: mbArtist): Promise<string | undefined> {
  const settings = getSettings();
  const lidarrSettings = settings.lidarr.find((lidarr) => lidarr.isDefault);
  if (!lidarrSettings) {
    throw new Error('No default Lidarr instance found');
  }
  const lidarr = new LidarrAPI({
    apiKey: lidarrSettings.apiKey,
    url: LidarrAPI.buildUrl(lidarrSettings, '/api/v1'),
  });
  try {
    const artist = await lidarr.getArtist(element.id);
    return (
      artist.images ?? [{ coverType: 'fanart', remoteUrl: undefined }]
    ).filter((i) => i.coverType === 'fanart')[0].remoteUrl;
  } catch (e) {
    return undefined;
  }
}

const memoize = <T = unknown>(fn: (...val: T[]) => unknown) => {
  const cache = new Map();
  const cached = function (this: unknown, val: T) {
    return cache.has(val)
      ? cache.get(val)
      : cache.set(val, fn.call(this, val) as ReturnType<typeof fn>) &&
          cache.get(val);
  };
  cached.cache = cache;
  return cached;
};

const cachedFanartFromMB = memoize(getFanartFromMB);

export default memoize(getPosterFromMB);
export { cachedFanartFromMB };
