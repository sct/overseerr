import ExternalAPI from '@server/api/externalapi';
import cacheManager from '@server/lib/cache';
import logger from '@server/logger';
import { getSettings } from '@server/lib/settings';

interface FanartArtistImages {
  name: string;
  mbid_id: string;
  hdmusiclogo?: Array<{
    id: string;
    url: string;
    likes: string;
  }>;
  musiclogo?: Array<{
    id: string;
    url: string;
    likes: string;
  }>;
  hdmusicartistthumb?: Array<{
    id: string;
    url: string;
    likes: string;
  }>;
  musicartistthumb?: Array<{
    id: string;
    url: string;
    likes: string;
  }>;
  artistthumb?: Array<{
    id: string;
    url: string;
    likes: string;
  }>;
  artistbackground?: Array<{
    id: string;
    url: string;
    likes: string;
  }>;
}

interface FanartAlbumImages {
  albums: {
    [key: string]: Array<{
      id: string;
      url: string;
      likes: string;
      disc?: string;
      size?: string;
    }>;
  };
}

const FANART_BASE_URL = 'https://webservice.fanart.tv/v3/';

export const getFanartApiKey = (): string => {
  if (process.env.FANART_API_KEY) {
    return process.env.FANART_API_KEY;
  }
  
  const settings = getSettings();
  return settings.main.fanartApiKey ?? '';
};

class FanartAPI extends ExternalAPI {
  private apiKey: string;

  constructor() {
    const apiKey = getFanartApiKey();
    
    super(FANART_BASE_URL, {
      api_key: apiKey,
    }, {
      nodeCache: cacheManager.getCache('fanart'),
      rateLimit: {
        maxRPS: 2,
        maxRequests: 10,
      },
    });

    this.apiKey = apiKey;
    
    if (!apiKey) {
      logger.warn(
        'Fanart API key not configured. Fanart.tv integration will be disabled.'
      );
    }
  }

  public async getArtistImagesByMbid(mbid: string): Promise<FanartArtistImages | null> {
    if (!this.apiKey) return null;
    
    try {
      const data = await this.get<FanartArtistImages>(`music/${mbid}`);
      return data;
    } catch (e) {
      logger.debug(`Failed to fetch fanart images for artist ${mbid}`, {
        label: 'Fanart API',
        errorMessage: e.message,
      });
      return null;
    }
  }

  public async getAlbumImagesByMbid(mbid: string): Promise<FanartAlbumImages | null> {
    if (!this.apiKey) return null;
    
    try {
      const data = await this.get<FanartAlbumImages>(`albums/${mbid}`);
      return data;
    } catch (e) {
      logger.debug(`Failed to fetch fanart images for album ${mbid}`, {
        label: 'Fanart API',
        errorMessage: e.message,
      });
      return null;
    }
  }

  public pickArtistThumbnail(
    images: FanartArtistImages | null,
    preferHd = true
  ): string | undefined {
    if (!images) return undefined;

    const sources = preferHd
      ? [images.hdmusicartistthumb, images.musicartistthumb, images.artistthumb]
      : [images.musicartistthumb, images.artistthumb, images.hdmusicartistthumb];

    for (const source of sources) {
      if (source?.length) {
        const sorted = source.sort((a, b) => parseInt(b.likes) - parseInt(a.likes));
        return sorted[0]?.url;
      }
    }
    return undefined;
  }

  public pickArtistLogo(
    images: FanartArtistImages | null,
    preferHd = true
  ): string | undefined {
    if (!images) return undefined;

    const sources = preferHd
      ? [images.hdmusiclogo, images.musiclogo]
      : [images.musiclogo, images.hdmusiclogo];

    for (const source of sources) {
      if (source?.length) {
        const sorted = source.sort((a, b) => parseInt(b.likes) - parseInt(a.likes));
        return sorted[0]?.url;
      }
    }
    return undefined;
  }

  public pickArtistBackground(
    images: FanartArtistImages | null
  ): string | undefined {
    if (!images?.artistbackground?.length) return undefined;

    const sorted = images.artistbackground.sort(
      (a, b) => parseInt(b.likes) - parseInt(a.likes)
    );
    return sorted[0]?.url;
  }

  public pickAlbumCover(
    images: FanartAlbumImages | null
  ): string | undefined {
    if (!images?.albums) return undefined;

    const albumKeys = Object.keys(images.albums);
    if (!albumKeys.length) return undefined;

    for (const key of albumKeys) {
      const covers = images.albums[key];
      
      const sorted = covers.sort((a, b) => parseInt(b.likes) - parseInt(a.likes));
      
      const discCover = sorted.find(c => c.disc === '1');
      if (discCover) return discCover.url;
      
      if (sorted.length) return sorted[0].url;
    }
    return undefined;
  }

  public isConfigured(): boolean {
    return !!this.apiKey;
  }
}

export default FanartAPI;
