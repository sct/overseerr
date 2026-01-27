import LidarrAPI from '@server/api/servarr/lidarr';
import type { LidarrSettings } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { Router } from 'express';

const lidarrRoutes = Router();

lidarrRoutes.get('/', (_req, res) => {
  const settings = getSettings();

  res.status(200).json(settings.lidarr || []);
});

lidarrRoutes.post('/', (req, res, next) => {
  const settings = getSettings();

  // Basic validation for required fields
  if (!req.body.name || !req.body.hostname || !req.body.apiKey) {
    return next({
      status: 400,
      message:
        'Missing required fields: name, hostname, and apiKey are required.',
    });
  }

  // Validate port is a number and within valid range
  if (
    req.body.port === undefined ||
    req.body.port === null ||
    !Number.isInteger(Number(req.body.port)) ||
    Number(req.body.port) < 1 ||
    Number(req.body.port) > 65535
  ) {
    return next({
      status: 400,
      message: 'Port must be a valid integer between 1 and 65535.',
    });
  }

  const newLidarr = req.body as LidarrSettings;
  const lastItem = settings.lidarr[settings.lidarr.length - 1];
  newLidarr.id = lastItem ? lastItem.id + 1 : 0;

  // If we are setting this as the default, clear any previous defaults
  if (req.body.isDefault) {
    settings.lidarr.forEach((lidarrInstance) => {
      lidarrInstance.isDefault = false;
    });
  }

  settings.lidarr = [...settings.lidarr, newLidarr];
  settings.save();

  return res.status(201).json(newLidarr);
});

lidarrRoutes.post<
  undefined,
  Record<string, unknown>,
  LidarrSettings & { tagLabel?: string }
>('/test', async (req, res, next) => {
  try {
    const lidarr = new LidarrAPI({
      apiKey: req.body.apiKey,
      url: LidarrAPI.buildUrl(req.body, '/api/v1'),
    });

    const urlBase = await lidarr
      .getSystemStatus()
      .then((value) => value.urlBase)
      .catch(() => req.body.baseUrl);
    const profiles = await lidarr.getProfiles();
    const metadataProfiles = await lidarr.getMetadataProfiles();
    const folders = await lidarr.getRootFolders();
    const tags = await lidarr.getTags();

    return res.status(200).json({
      profiles,
      metadataProfiles,
      rootFolders: folders.map((folder) => ({
        id: folder.id,
        path: folder.path,
      })),
      tags,
      urlBase,
    });
  } catch (e) {
    logger.error('Failed to test Lidarr', {
      label: 'Lidarr',
      message: e.message,
    });

    next({ status: 500, message: 'Failed to connect to Lidarr' });
  }
});

lidarrRoutes.put<{ id: string }, LidarrSettings, LidarrSettings>(
  '/:id',
  (req, res, next) => {
    const settings = getSettings();

    // Validate ID parameter
    const lidarrId = Number(req.params.id);
    if (isNaN(lidarrId)) {
      return next({
        status: 400,
        message: 'Invalid Lidarr instance ID.',
      });
    }

    // Basic validation for required fields
    if (!req.body.name || !req.body.hostname || !req.body.apiKey) {
      return next({
        status: 400,
        message:
          'Missing required fields: name, hostname, and apiKey are required.',
      });
    }

    // Validate port is a number and within valid range
    if (
      req.body.port === undefined ||
      req.body.port === null ||
      !Number.isInteger(Number(req.body.port)) ||
      Number(req.body.port) < 1 ||
      Number(req.body.port) > 65535
    ) {
      return next({
        status: 400,
        message: 'Port must be a valid integer between 1 and 65535.',
      });
    }

    const lidarrIndex = settings.lidarr.findIndex((l) => l.id === lidarrId);

    if (lidarrIndex === -1) {
      return next({ status: 404, message: 'Settings instance not found' });
    }

    // If we are setting this as the default, clear any previous defaults
    if (req.body.isDefault) {
      settings.lidarr.forEach((lidarrInstance) => {
        lidarrInstance.isDefault = false;
      });
    }

    settings.lidarr[lidarrIndex] = {
      ...req.body,
      id: lidarrId,
    } as LidarrSettings;
    settings.save();

    return res.status(200).json(settings.lidarr[lidarrIndex]);
  }
);

lidarrRoutes.get<{ id: string }>('/:id/profiles', async (req, res, next) => {
  const settings = getSettings();

  const lidarrSettings = settings.lidarr.find(
    (l) => l.id === Number(req.params.id)
  );

  if (!lidarrSettings) {
    return next({ status: 404, message: 'Settings instance not found' });
  }

  const lidarr = new LidarrAPI({
    apiKey: lidarrSettings.apiKey,
    url: LidarrAPI.buildUrl(lidarrSettings, '/api/v1'),
  });

  const profiles = await lidarr.getProfiles();

  return res.status(200).json(
    profiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
    }))
  );
});

lidarrRoutes.get<{ id: string }>(
  '/:id/metadataprofiles',
  async (req, res, next) => {
    const settings = getSettings();

    const lidarrSettings = settings.lidarr.find(
      (l) => l.id === Number(req.params.id)
    );

    if (!lidarrSettings) {
      return next({ status: 404, message: 'Settings instance not found' });
    }

    const lidarr = new LidarrAPI({
      apiKey: lidarrSettings.apiKey,
      url: LidarrAPI.buildUrl(lidarrSettings, '/api/v1'),
    });

    const metadataProfiles = await lidarr.getMetadataProfiles();

    return res.status(200).json(
      metadataProfiles.map((profile) => ({
        id: profile.id,
        name: profile.name,
      }))
    );
  }
);

lidarrRoutes.delete<{ id: string }>('/:id', (req, res, next) => {
  const settings = getSettings();

  const lidarrIndex = settings.lidarr.findIndex(
    (l) => l.id === Number(req.params.id)
  );

  if (lidarrIndex === -1) {
    return next({ status: 404, message: 'Settings instance not found' });
  }

  const removed = settings.lidarr.splice(lidarrIndex, 1);
  settings.save();

  return res.status(200).json(removed[0]);
});

export default lidarrRoutes;
