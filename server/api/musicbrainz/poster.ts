import LidarrAPI from '@server/api/servarr/lidarr';
import { getSettings } from '@server/lib/settings';
import type { mbArtist, mbRelease, mbReleaseGroup } from './interfaces';

function getPosterFromMB(
  element: mbRelease | mbReleaseGroup | mbArtist
): string | undefined {
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
      const artist = (lidarr as LidarrAPI).getArtist(element.id);
      return LidarrAPI.buildUrl(
        lidarrSettings,
        (artist.images ?? [{ coverType: 'poster', url: undefined }]).find(
          (i) => i.coverType === 'poster'
        )?.url
      );
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
    const artist = lidarr.getArtist(element.id);
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
