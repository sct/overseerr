import { Router } from 'express';
import RadarrAPI from '../api/radarr';
import SonarrAPI from '../api/sonarr';
import {
  ServiceCommonServer,
  ServiceCommonServerWithDetails,
} from '../interfaces/api/serviceInterfaces';
import { getSettings } from '../lib/settings';
import TheMovieDb from '../api/themoviedb';
import logger from '../logger';

const serviceRoutes = Router();

serviceRoutes.get('/radarr', async (req, res) => {
  const settings = getSettings();

  const filteredRadarrServers: ServiceCommonServer[] = settings.radarr.map(
    (radarr) => ({
      id: radarr.id,
      name: radarr.name,
      is4k: radarr.is4k,
      isDefault: radarr.isDefault,
      activeDirectory: radarr.activeDirectory,
      activeProfileId: radarr.activeProfileId,
    })
  );

  return res.status(200).json(filteredRadarrServers);
});

serviceRoutes.get<{ radarrId: string }>(
  '/radarr/:radarrId',
  async (req, res, next) => {
    const settings = getSettings();

    const radarrSettings = settings.radarr.find(
      (radarr) => radarr.id === Number(req.params.radarrId)
    );

    if (!radarrSettings) {
      return next({
        status: 404,
        message: 'Radarr server with provided ID  does not exist.',
      });
    }

    const radarr = new RadarrAPI({
      apiKey: radarrSettings.apiKey,
      url: `${radarrSettings.useSsl ? 'https' : 'http'}://${
        radarrSettings.hostname
      }:${radarrSettings.port}${radarrSettings.baseUrl ?? ''}/api`,
    });

    const profiles = await radarr.getProfiles();
    const rootFolders = await radarr.getRootFolders();

    return res.status(200).json({
      server: {
        id: radarrSettings.id,
        name: radarrSettings.name,
        is4k: radarrSettings.is4k,
        isDefault: radarrSettings.isDefault,
        activeDirectory: radarrSettings.activeDirectory,
        activeProfileId: radarrSettings.activeProfileId,
      },
      profiles: profiles.map((profile) => ({
        id: profile.id,
        name: profile.name,
      })),
      rootFolders: rootFolders.map((folder) => ({
        id: folder.id,
        freeSpace: folder.freeSpace,
        path: folder.path,
        totalSpace: folder.totalSpace,
      })),
    } as ServiceCommonServerWithDetails);
  }
);

serviceRoutes.get('/sonarr', async (req, res) => {
  const settings = getSettings();

  const filteredSonarrServers: ServiceCommonServer[] = settings.sonarr.map(
    (sonarr) => ({
      id: sonarr.id,
      name: sonarr.name,
      is4k: sonarr.is4k,
      isDefault: sonarr.isDefault,
      activeDirectory: sonarr.activeDirectory,
      activeProfileId: sonarr.activeProfileId,
      activeAnimeProfileId: sonarr.activeAnimeProfileId,
      activeAnimeDirectory: sonarr.activeAnimeDirectory,
    })
  );

  return res.status(200).json(filteredSonarrServers);
});

serviceRoutes.get<{ sonarrId: string }>(
  '/sonarr/:sonarrId',
  async (req, res, next) => {
    const settings = getSettings();

    const sonarrSettings = settings.sonarr.find(
      (sonarr) => sonarr.id === Number(req.params.sonarrId)
    );

    if (!sonarrSettings) {
      return next({
        status: 404,
        message: 'Sonarr server with provided ID  does not exist.',
      });
    }

    const sonarr = new SonarrAPI({
      apiKey: sonarrSettings.apiKey,
      url: `${sonarrSettings.useSsl ? 'https' : 'http'}://${
        sonarrSettings.hostname
      }:${sonarrSettings.port}${sonarrSettings.baseUrl ?? ''}/api`,
    });

    const profiles = await sonarr.getProfiles();
    const rootFolders = await sonarr.getRootFolders();

    return res.status(200).json({
      server: {
        id: sonarrSettings.id,
        name: sonarrSettings.name,
        is4k: sonarrSettings.is4k,
        isDefault: sonarrSettings.isDefault,
        activeDirectory: sonarrSettings.activeDirectory,
        activeProfileId: sonarrSettings.activeProfileId,
        activeAnimeProfileId: sonarrSettings.activeAnimeProfileId,
        activeAnimeDirectory: sonarrSettings.activeAnimeDirectory,
      },
      profiles: profiles.map((profile) => ({
        id: profile.id,
        name: profile.name,
      })),
      rootFolders: rootFolders.map((folder) => ({
        id: folder.id,
        freeSpace: folder.freeSpace,
        path: folder.path,
        totalSpace: folder.totalSpace,
      })),
    } as ServiceCommonServerWithDetails);
  }
);

serviceRoutes.get<{ tmdbId: string }>(
  '/sonarr/lookup/:tmdbId',
  async (req, res, next) => {
    const settings = getSettings();
    const tmdb = new TheMovieDb();

    const sonarrSettings = settings.sonarr[0];

    if (!sonarrSettings) {
      logger.error('No sonarr server has been setup', {
        label: 'Media Request',
      });
      return next({
        status: 404,
        message: 'No sonarr server has been setup',
      });
    }

    const sonarr = new SonarrAPI({
      apiKey: sonarrSettings.apiKey,
      url: `${sonarrSettings.useSsl ? 'https' : 'http'}://${
        sonarrSettings.hostname
      }:${sonarrSettings.port}${sonarrSettings.baseUrl ?? ''}/api`,
    });

    try {
      const tv = await tmdb.getTvShow({
        tvId: Number(req.params.tmdbId),
        language: req.query.language as string,
      });

      const response = await sonarr.getSeriesByTitle(tv.name);

      return res.status(200).json(response);
    } catch (e) {
      logger.error('Failed to fetch tvdb search results', {
        label: 'Media Request',
        message: e.message,
      });
      next({
        status: 500,
        message: 'Failed to fetch tvdb search results',
      });
    }

    return next({
      status: 500,
      message: 'Something went wrong trying to fetch series information',
    });
  }
);

export default serviceRoutes;
