import axios from 'axios';

export interface LastFmArtistInfo {
  name?: string;
  mbid?: string;
  url?: string;
  bio?: {
    summary?: string;
    content?: string;
  };
  image?: { '#text'?: string; size?: string }[];
}

const LASTFM_BASE_URL = 'https://ws.audioscrobbler.com/2.0/';

export const getLastFmApiKey = () => process.env.LASTFM_API_KEY;

export const getLastFmArtistInfoByMbid = async (
  mbid: string
): Promise<LastFmArtistInfo | null> => {
  const apiKey = getLastFmApiKey();
  if (!apiKey) {
    return null;
  }

  const { data } = await axios.get(LASTFM_BASE_URL, {
    params: {
      method: 'artist.getInfo',
      mbid,
      api_key: apiKey,
      format: 'json',
    },
    timeout: 8000,
  });

  return (data?.artist as LastFmArtistInfo) ?? null;
};

export const pickLastFmImage = (
  artist: LastFmArtistInfo | null,
  preferredSizes: string[] = ['extralarge', 'large', 'medium', 'small']
): string | undefined => {
  const images = artist?.image ?? [];
  for (const size of preferredSizes) {
    const url = images.find((i) => i.size === size)?.['#text'];
    if (url) {
      return url;
    }
  }
  return images.find((i) => i?.['#text'])?.['#text'];
};
