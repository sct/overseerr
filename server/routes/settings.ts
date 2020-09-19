import { Router } from 'express';
import { getSettings, RadarrSettings, SonarrSettings } from '../lib/settings';
import { getRepository } from 'typeorm';
import { User } from '../entity/User';
import PlexAPI from '../api/plexapi';

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

export default settingsRoutes;
