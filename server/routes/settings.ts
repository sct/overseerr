import { Router } from 'express';
import {
  getSettings,
  RadarrSettings,
  SonarrSettings,
  Library,
} from '../lib/settings';
import { getRepository } from 'typeorm';
import { User } from '../entity/User';
import PlexAPI, { PlexLibrary } from '../api/plexapi';
import { jobPlexFullSync } from '../job/plexsync';
import SonarrAPI from '../api/sonarr';
import RadarrAPI from '../api/radarr';
import logger from '../logger';
import { scheduledJobs } from '../job/schedule';

const settingsRoutes = Router();

settingsRoutes.get('/main', (_req, res) => {
  const settings = getSettings();

  res.status(200).json(settings.main);
});

settingsRoutes.post('/main', (req, res) => {
  const settings = getSettings();

  settings.main = req.body;
  settings.save();

  return res.status(200).json(settings.main);
});

settingsRoutes.get('/plex', (_req, res) => {
  const settings = getSettings();

  res.status(200).json(settings.plex);
});

settingsRoutes.post('/plex', async (req, res, next) => {
  const userRepository = getRepository(User);
  const settings = getSettings();
  try {
    const admin = await userRepository.findOneOrFail({
      select: ['id', 'plexToken'],
      order: { id: 'ASC' },
    });

    Object.assign(settings.plex, req.body);

    const plexClient = new PlexAPI({ plexToken: admin.plexToken });

    const result = await plexClient.getStatus();

    if (result?.MediaContainer?.machineIdentifier) {
      settings.plex.machineId = result.MediaContainer.machineIdentifier;
      settings.plex.name = result.MediaContainer.friendlyName;

      settings.save();
    }
  } catch (e) {
    return next({
      status: 500,
      message: `Failed to connect to Plex: ${e.message}`,
    });
  }

  return res.status(200).json(settings.plex);
});

settingsRoutes.get('/plex/library', async (req, res) => {
  const settings = getSettings();

  if (req.query.sync) {
    const userRepository = getRepository(User);
    const admin = await userRepository.findOneOrFail({
      select: ['id', 'plexToken'],
      order: { id: 'ASC' },
    });
    const plexapi = new PlexAPI({ plexToken: admin.plexToken });

    const libraries = await plexapi.getLibraries();

    const newLibraries: Library[] = libraries.map((library) => {
      const existing = settings.plex.libraries.find(
        (l) => l.id === library.key
      );

      return {
        id: library.key,
        name: library.title,
        enabled: existing?.enabled ?? false,
      };
    });

    settings.plex.libraries = newLibraries;
  }

  const enabledLibraries = req.query.enable
    ? (req.query.enable as string).split(',')
    : [];
  settings.plex.libraries = settings.plex.libraries.map((library) => ({
    ...library,
    enabled: enabledLibraries.includes(library.id),
  }));
  settings.save();
  return res.status(200).json(settings.plex.libraries);
});

settingsRoutes.get('/plex/sync', (req, res) => {
  if (req.query.cancel) {
    jobPlexFullSync.cancel();
  } else if (req.query.start) {
    jobPlexFullSync.run();
  }

  return res.status(200).json(jobPlexFullSync.status());
});

settingsRoutes.get('/radarr', (req, res) => {
  const settings = getSettings();

  res.status(200).json(settings.radarr);
});

settingsRoutes.post('/radarr', (req, res) => {
  const settings = getSettings();

  const newRadarr = req.body as RadarrSettings;
  const lastItem = settings.radarr[settings.radarr.length - 1];
  newRadarr.id = lastItem ? lastItem.id + 1 : 0;

  settings.radarr = [...settings.radarr, newRadarr];
  settings.save();

  return res.status(201).json(newRadarr);
});

settingsRoutes.post('/radarr/test', async (req, res, next) => {
  try {
    const radarr = new RadarrAPI({
      apiKey: req.body.apiKey,
      url: `${req.body.useSsl ? 'https' : 'http'}://${req.body.hostname}:${
        req.body.port
      }${req.body.baseUrl ?? ''}/api`,
    });

    const profiles = await radarr.getProfiles();
    const folders = await radarr.getRootFolders();

    return res.status(200).json({
      profiles,
      rootFolders: folders.map((folder) => ({
        id: folder.id,
        path: folder.path,
      })),
    });
  } catch (e) {
    logger.error('Failed to test Radarr', {
      label: 'Radarr',
      message: e.message,
    });

    next({ status: 500, message: 'Failed to connect to Radarr' });
  }
});

settingsRoutes.put<{ id: string }>('/radarr/:id', (req, res) => {
  const settings = getSettings();

  const radarrIndex = settings.radarr.findIndex(
    (r) => r.id === Number(req.params.id)
  );

  if (radarrIndex === -1) {
    return res
      .status(404)
      .json({ status: '404', message: 'Settings instance not found' });
  }

  settings.radarr[radarrIndex] = {
    ...req.body,
    id: Number(req.params.id),
  } as RadarrSettings;
  settings.save();

  return res.status(200).json(settings.radarr[radarrIndex]);
});

settingsRoutes.get<{ id: string }>('/radarr/:id/profiles', async (req, res) => {
  const settings = getSettings();

  const radarrSettings = settings.radarr.find(
    (r) => r.id === Number(req.params.id)
  );

  if (!radarrSettings) {
    return res
      .status(404)
      .json({ status: '404', message: 'Settings instance not found' });
  }

  const radarr = new RadarrAPI({
    apiKey: radarrSettings.apiKey,
    url: `${radarrSettings.useSsl ? 'https' : 'http'}://${
      radarrSettings.hostname
    }:${radarrSettings.port}${radarrSettings.baseUrl ?? ''}/api`,
  });

  const profiles = await radarr.getProfiles();

  return res.status(200).json(
    profiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
    }))
  );
});

settingsRoutes.delete<{ id: string }>('/radarr/:id', (req, res) => {
  const settings = getSettings();

  const radarrIndex = settings.radarr.findIndex(
    (r) => r.id === Number(req.params.id)
  );

  if (radarrIndex === -1) {
    return res
      .status(404)
      .json({ status: '404', message: 'Settings instance not found' });
  }

  const removed = settings.radarr.splice(radarrIndex, 1);
  settings.save();

  return res.status(200).json(removed[0]);
});

settingsRoutes.get('/sonarr', (req, res) => {
  const settings = getSettings();

  res.status(200).json(settings.sonarr);
});

settingsRoutes.post('/sonarr', (req, res) => {
  const settings = getSettings();

  const newSonarr = req.body as SonarrSettings;
  const lastItem = settings.sonarr[settings.sonarr.length - 1];
  newSonarr.id = lastItem ? lastItem.id + 1 : 0;

  settings.sonarr = [...settings.sonarr, newSonarr];
  settings.save();

  return res.status(201).json(newSonarr);
});

settingsRoutes.post('/sonarr/test', async (req, res, next) => {
  try {
    const sonarr = new SonarrAPI({
      apiKey: req.body.apiKey,
      url: `${req.body.useSsl ? 'https' : 'http'}://${req.body.hostname}:${
        req.body.port
      }${req.body.baseUrl ?? ''}/api`,
    });

    const profiles = await sonarr.getProfiles();
    const folders = await sonarr.getRootFolders();

    return res.status(200).json({
      profiles,
      rootFolders: folders.map((folder) => ({
        id: folder.id,
        path: folder.path,
      })),
    });
  } catch (e) {
    logger.error('Failed to test Sonarr', {
      label: 'Sonarr',
      message: e.message,
    });

    next({ status: 500, message: 'Failed to connect to Sonarr' });
  }
});

settingsRoutes.put<{ id: string }>('/sonarr/:id', (req, res) => {
  const settings = getSettings();

  const sonarrIndex = settings.sonarr.findIndex(
    (r) => r.id === Number(req.params.id)
  );

  if (sonarrIndex === -1) {
    return res
      .status(404)
      .json({ status: '404', message: 'Settings instance not found' });
  }

  settings.sonarr[sonarrIndex] = {
    ...req.body,
    id: Number(req.params.id),
  } as SonarrSettings;
  settings.save();

  return res.status(200).json(settings.sonarr[sonarrIndex]);
});

settingsRoutes.delete<{ id: string }>('/sonarr/:id', (req, res) => {
  const settings = getSettings();

  const sonarrIndex = settings.sonarr.findIndex(
    (r) => r.id === Number(req.params.id)
  );

  if (sonarrIndex === -1) {
    return res
      .status(404)
      .json({ status: '404', message: 'Settings instance not found' });
  }

  const removed = settings.sonarr.splice(sonarrIndex, 1);
  settings.save();

  return res.status(200).json(removed[0]);
});

settingsRoutes.get('/jobs', (req, res) => {
  return res.status(200).json(
    scheduledJobs.map((job) => ({
      name: job.name,
      nextExecutionTime: job.job.nextInvocation(),
    }))
  );
});

export default settingsRoutes;
