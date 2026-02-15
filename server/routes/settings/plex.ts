import PlexAPI from '@server/api/plexapi';
import PlexTvAPI from '@server/api/plextv';
import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import type { PlexConnection } from '@server/interfaces/api/plexInterfaces';
import { plexFullScanner } from '@server/lib/scanners/plex';
import type { PlexSettings } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { Router } from 'express';

const plexRoutes = Router();

// ============================================================
// STATIC ROUTES MUST BE DEFINED BEFORE DYNAMIC /:id ROUTES
// ============================================================

// GET /sync - Get scan status
plexRoutes.get('/sync', (_req, res) => {
  return res.status(200).json(plexFullScanner.status());
});

// POST /sync - Start/cancel scan
plexRoutes.post('/sync', (req, res) => {
  if (req.body.cancel) {
    plexFullScanner.cancel();
  } else if (req.body.start) {
    plexFullScanner.run();
  }
  return res.status(200).json(plexFullScanner.status());
});

// POST /test - Test connection
plexRoutes.post<undefined, Record<string, unknown>, PlexSettings>(
  '/test',
  async (req, res, next) => {
    const userRepository = getRepository(User);

    try {
      const admin = await userRepository.findOneOrFail({
        select: { id: true, plexToken: true },
        where: { id: 1 },
      });

      // Use server-specific token if provided, otherwise fallback to admin token
      const token = req.body.authToken || admin.plexToken;

      logger.debug('Testing Plex connection', {
        label: 'Plex',
        ip: req.body.ip,
        port: req.body.port,
        useSsl: req.body.useSsl,
        hasToken: !!token,
        usingServerToken: !!req.body.authToken,
      });

      if (!token) {
        logger.error('No Plex token available for test', { label: 'Plex' });
        return next({
          status: 400,
          message:
            'No authentication token available. Please provide a server owner token or sign in with Plex first.',
        });
      }

      const plexClient = new PlexAPI({
        plexToken: token,
        plexSettings: req.body,
      });

      const result = await plexClient.getStatus();

      if (!result?.MediaContainer?.machineIdentifier) {
        throw new Error('Server not found - no machineIdentifier in response');
      }

      logger.info('Plex connection test successful', {
        label: 'Plex',
        machineId: result.MediaContainer.machineIdentifier,
        name: result.MediaContainer.friendlyName,
      });

      return res.status(200).json({
        success: true,
        machineId: result.MediaContainer.machineIdentifier,
        name: result.MediaContainer.friendlyName,
      });
    } catch (e) {
      logger.error('Failed to test Plex connection', {
        label: 'Plex',
        errorMessage: e.message,
        stack: e.stack,
        ip: req.body.ip,
        port: req.body.port,
      });
      return next({
        status: 500,
        message: `Failed to connect to Plex server: ${e.message}`,
      });
    }
  }
);

// GET /devices/servers - Fetch available servers from plex.tv
plexRoutes.get('/devices/servers', async (_req, res, next) => {
  const userRepository = getRepository(User);
  try {
    const admin = await userRepository.findOneOrFail({
      select: { id: true, plexToken: true },
      where: { id: 1 },
    });
    const plexTvClient = admin.plexToken
      ? new PlexTvAPI(admin.plexToken)
      : null;
    const devices = (await plexTvClient?.getDevices())?.filter((device) => {
      return device.provides.includes('server') && device.owned;
    });

    if (devices) {
      await Promise.all(
        devices.map(async (device) => {
          const plexDirectConnections: PlexConnection[] = [];

          device.connection.forEach((connection) => {
            const url = new URL(connection.uri);

            if (url.hostname !== connection.address) {
              const plexDirectConnection = { ...connection };
              plexDirectConnection.address = url.hostname;
              plexDirectConnections.push(plexDirectConnection);

              // Connect to IP addresses over HTTP
              connection.protocol = 'http';
            }
          });

          plexDirectConnections.forEach((plexDirectConnection) => {
            device.connection.push(plexDirectConnection);
          });

          await Promise.all(
            device.connection.map(async (connection) => {
              const plexDeviceSettings: PlexSettings = {
                id: -1, // Temporary ID for testing
                name: device.name,
                ip: connection.address,
                port: connection.port,
                useSsl: connection.protocol === 'https',
                libraries: [],
              };
              const plexClient = new PlexAPI({
                plexToken: admin.plexToken,
                plexSettings: plexDeviceSettings,
                timeout: 5000,
              });

              try {
                await plexClient.getStatus();
                connection.status = 200;
                connection.message = 'OK';
              } catch (e) {
                connection.status = 500;
                connection.message = e.message.split(':')[0];
              }
            })
          );
        })
      );
    }
    return res.status(200).json(devices);
  } catch (e) {
    logger.error('Something went wrong retrieving Plex server list', {
      label: 'API',
      errorMessage: e.message,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve Plex server list.',
    });
  }
});

// GET /users - Fetch unimported Plex users from all servers
plexRoutes.get('/users', async (req, res, next) => {
  const userRepository = getRepository(User);
  const qb = userRepository.createQueryBuilder('user');

  try {
    const admin = await userRepository.findOneOrFail({
      select: { id: true, plexToken: true },
      where: { id: 1 },
    });

    // Get users from ALL configured Plex servers (multi-owner support)
    const allPlexUsers = await PlexTvAPI.getAllUsersFromAllServers(
      admin.plexToken ?? undefined
    );

    logger.debug(
      `Found ${allPlexUsers.length} total users across all Plex servers`,
      {
        label: 'Plex',
      }
    );

    // Dedupe by plexId, keeping the first server encountered
    const uniquePlexUsers = allPlexUsers.reduce((acc, user) => {
      if (!acc.find((u) => u.plexId === user.plexId)) {
        acc.push(user);
      }
      return acc;
    }, [] as typeof allPlexUsers);

    const unimportedPlexUsers: {
      id: string;
      title: string;
      username: string;
      email: string;
      thumb: string;
      plexServerId: number;
      plexServerName: string;
    }[] = [];

    if (uniquePlexUsers.length === 0) {
      logger.debug('No Plex users found on any server', { label: 'Plex' });
      return res.status(200).json([]);
    }

    const existingUsers = await qb
      .where('user.plexId IN (:...plexIds)', {
        plexIds: uniquePlexUsers.map((plexUser) => plexUser.plexId),
      })
      .orWhere('user.email IN (:...plexEmails)', {
        plexEmails: uniquePlexUsers
          .map((plexUser) => plexUser.email?.toLowerCase())
          .filter(Boolean),
      })
      .getMany();

    for (const plexUser of uniquePlexUsers) {
      const alreadyExists = existingUsers.find(
        (user) =>
          user.plexId === plexUser.plexId ||
          (plexUser.email && user.email === plexUser.email.toLowerCase())
      );

      if (!alreadyExists) {
        unimportedPlexUsers.push({
          id: String(plexUser.plexId),
          title: plexUser.username,
          username: plexUser.username,
          email: plexUser.email,
          thumb: plexUser.thumb,
          plexServerId: plexUser.plexServerId,
          plexServerName: plexUser.plexServerName,
        });
      }
    }

    // Count users per server for debugging
    const serverCounts = unimportedPlexUsers.reduce((acc, user) => {
      const serverName = user.plexServerName || 'unknown';
      acc[serverName] = (acc[serverName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    logger.debug(
      `Found ${unimportedPlexUsers.length} unimported users (${existingUsers.length} already exist)`,
      { label: 'Plex', serverCounts }
    );

    return res
      .status(200)
      .json(
        unimportedPlexUsers.sort((a, b) => a.username.localeCompare(b.username))
      );
  } catch (e) {
    logger.error('Something went wrong getting unimported Plex users', {
      label: 'API',
      errorMessage: e.message,
    });
    next({
      status: 500,
      message: 'Unable to retrieve unimported Plex users.',
    });
  }
});

// ============================================================
// BASE ROUTES (/ for list and add)
// ============================================================

plexRoutes.get('/', (_req, res) => {
  const settings = getSettings();
  res.status(200).json(settings.plex);
});

plexRoutes.post('/', async (req, res, next) => {
  const userRepository = getRepository(User);
  const settings = getSettings();

  try {
    const admin = await userRepository.findOneOrFail({
      select: { id: true, plexToken: true },
      where: { id: 1 },
    });

    const newPlex = req.body as PlexSettings;
    const lastItem = settings.plex[settings.plex.length - 1];
    newPlex.id = lastItem ? lastItem.id + 1 : 0;

    // Use server-specific token if provided, otherwise fallback to admin token
    const token = newPlex.authToken || admin.plexToken;

    const plexClient = new PlexAPI({
      plexToken: token,
      plexSettings: newPlex,
    });

    const result = await plexClient.getStatus();

    if (!result?.MediaContainer?.machineIdentifier) {
      throw new Error('Server not found');
    }

    newPlex.machineId = result.MediaContainer.machineIdentifier;
    newPlex.name = newPlex.name || result.MediaContainer.friendlyName;

    settings.plex = [...settings.plex, newPlex];
    settings.save();

    return res.status(201).json(newPlex);
  } catch (e) {
    logger.error('Failed to add Plex server', {
      label: 'Plex',
      errorMessage: e.message,
    });
    return next({
      status: 500,
      message: 'Failed to connect to Plex server.',
    });
  }
});

// ============================================================
// DYNAMIC /:plexId ROUTES
// ============================================================

plexRoutes.put<{ plexId: string }, PlexSettings, PlexSettings>(
  '/:plexId',
  async (req, res, next) => {
    const userRepository = getRepository(User);
    const settings = getSettings();

    const plexIndex = settings.plex.findIndex(
      (p) => p.id === Number(req.params.plexId)
    );

    if (plexIndex === -1) {
      return next({ status: 404, message: 'Plex server not found' });
    }

    try {
      const admin = await userRepository.findOneOrFail({
        select: { id: true, plexToken: true },
        where: { id: 1 },
      });

      const updatedPlex = {
        ...req.body,
        id: Number(req.params.plexId),
      };

      // Use server-specific token if provided, otherwise fallback to admin token
      const token = updatedPlex.authToken || admin.plexToken;

      const plexClient = new PlexAPI({
        plexToken: token,
        plexSettings: updatedPlex,
      });

      const result = await plexClient.getStatus();

      if (!result?.MediaContainer?.machineIdentifier) {
        throw new Error('Server not found');
      }

      updatedPlex.machineId = result.MediaContainer.machineIdentifier;
      updatedPlex.name = updatedPlex.name || result.MediaContainer.friendlyName;

      settings.plex[plexIndex] = updatedPlex;
      settings.save();

      return res.status(200).json(updatedPlex);
    } catch (e) {
      logger.error('Failed to update Plex server', {
        label: 'Plex',
        errorMessage: e.message,
      });
      return next({
        status: 500,
        message: 'Failed to connect to Plex server.',
      });
    }
  }
);

plexRoutes.delete<{ plexId: string }>('/:plexId', (req, res, next) => {
  const settings = getSettings();

  const plexIndex = settings.plex.findIndex(
    (p) => p.id === Number(req.params.plexId)
  );

  if (plexIndex === -1) {
    return next({ status: 404, message: 'Plex server not found' });
  }

  const removed = settings.plex.splice(plexIndex, 1);
  settings.save();

  return res.status(200).json(removed[0]);
});

plexRoutes.get<{ plexId: string }>('/:plexId', (req, res, next) => {
  const settings = getSettings();

  const plexServer = settings.plex.find(
    (p) => p.id === Number(req.params.plexId)
  );

  if (!plexServer) {
    return next({ status: 404, message: 'Plex server not found' });
  }

  return res.status(200).json(plexServer);
});

plexRoutes.get<{ plexId: string }>(
  '/:plexId/libraries',
  async (req, res, next) => {
    const userRepository = getRepository(User);
    const settings = getSettings();

    const plexServer = settings.plex.find(
      (p) => p.id === Number(req.params.plexId)
    );

    if (!plexServer) {
      return next({ status: 404, message: 'Plex server not found' });
    }

    try {
      const admin = await userRepository.findOneOrFail({
        select: { id: true, plexToken: true },
        where: { id: 1 },
      });

      // Use server-specific token if available, fallback to admin token
      const token = plexServer.authToken || admin.plexToken;

      const plexClient = new PlexAPI({
        plexToken: token,
        plexSettings: plexServer,
      });

      const libraries = await plexClient.syncLibraries();

      return res.status(200).json(libraries);
    } catch (e) {
      logger.error('Failed to fetch Plex libraries', {
        label: 'Plex',
        errorMessage: e.message,
      });
      return next({
        status: 500,
        message: 'Failed to fetch Plex libraries.',
      });
    }
  }
);

plexRoutes.post<{ plexId: string }>(
  '/:plexId/libraries/sync',
  async (req, res, next) => {
    const userRepository = getRepository(User);
    const settings = getSettings();

    const plexIndex = settings.plex.findIndex(
      (p) => p.id === Number(req.params.plexId)
    );

    if (plexIndex === -1) {
      return next({ status: 404, message: 'Plex server not found' });
    }

    try {
      const admin = await userRepository.findOneOrFail({
        select: { id: true, plexToken: true },
        where: { id: 1 },
      });

      // Use server-specific token if available, fallback to admin token
      const token = settings.plex[plexIndex].authToken || admin.plexToken;

      const plexClient = new PlexAPI({
        plexToken: token,
        plexSettings: settings.plex[plexIndex],
      });

      const libraries = await plexClient.syncLibraries();
      settings.plex[plexIndex].libraries = libraries;
      settings.save();

      return res.status(200).json(libraries);
    } catch (e) {
      logger.error('Failed to sync Plex libraries', {
        label: 'Plex',
        errorMessage: e.message,
      });
      return next({
        status: 500,
        message: 'Failed to sync Plex libraries.',
      });
    }
  }
);

// Toggle library enabled state for a specific server
plexRoutes.put<{ plexId: string; libraryId: string }>(
  '/:plexId/libraries/:libraryId',
  (req, res, next) => {
    const settings = getSettings();

    const plexIndex = settings.plex.findIndex(
      (p) => p.id === Number(req.params.plexId)
    );

    if (plexIndex === -1) {
      return next({ status: 404, message: 'Plex server not found' });
    }

    const libraryIndex = settings.plex[plexIndex].libraries.findIndex(
      (lib) => lib.id === req.params.libraryId
    );

    if (libraryIndex === -1) {
      return next({ status: 404, message: 'Library not found' });
    }

    // Toggle or set enabled state
    const newEnabled =
      req.body.enabled !== undefined
        ? req.body.enabled
        : !settings.plex[plexIndex].libraries[libraryIndex].enabled;

    settings.plex[plexIndex].libraries[libraryIndex].enabled = newEnabled;
    settings.save();

    return res.status(200).json(settings.plex[plexIndex].libraries);
  }
);

export default plexRoutes;
