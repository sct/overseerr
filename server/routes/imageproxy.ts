import LidarrAPI from '@server/api/servarr/lidarr';
import ImageProxy from '@server/lib/imageproxy';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { Router } from 'express';

const router = Router();
const tmdbImageProxy = new ImageProxy('tmdb', 'https://image.tmdb.org', {
  rateLimitOptions: {
    maxRequests: 20,
    maxRPS: 50,
  },
});

/**
 * Image Proxy
 */
router.get('/lidarr', async (req, res) => {
  const artistId = Number(req.query.artistId);
  try {
    const settings = getSettings();
    const lidarrSettings = settings.lidarr.find((lidarr) => lidarr.isDefault);
    if (!lidarrSettings) {
      throw new Error('No default Lidarr instance found');
    }
    const lidarr: LidarrAPI = new LidarrAPI({
      apiKey: lidarrSettings.apiKey,
      url: LidarrAPI.buildUrl(lidarrSettings, '/api/v1'),
    });

    const image = await lidarr.getArtistPoster(artistId);

    image.pipe(res);
  } catch (e) {
    logger.error('Failed to proxy lidarr image', {
      artistId: artistId,
      errorMessage: e.message,
    });
    res.status(500).send();
  }
});

router.get('/tmdb/*', async (req, res) => {
  const imagePath = req.path.replace('/image', '');
  try {
    const imageData = await tmdbImageProxy.getImage(imagePath);

    res.writeHead(200, {
      'Content-Type': `image/${imageData.meta.extension}`,
      'Content-Length': imageData.imageBuffer.length,
      'Cache-Control': `public, max-age=${imageData.meta.curRevalidate}`,
      'OS-Cache-Key': imageData.meta.cacheKey,
      'OS-Cache-Status': imageData.meta.cacheMiss ? 'MISS' : 'HIT',
    });

    res.end(imageData.imageBuffer);
  } catch (e) {
    logger.error('Failed to proxy tmdb image', {
      imagePath,
      errorMessage: e.message,
    });
    res.status(500).send();
  }
});

export default router;
