import { Router } from 'express';
import user from './user';
import authRoutes from './auth';
import { checkUser, isAuthenticated } from '../middleware/auth';
import settingsRoutes from './settings';
import { Permission } from '../lib/permissions';
import { getSettings } from '../lib/settings';
import searchRoutes from './search';
import discoverRoutes from './discover';
import requestRoutes from './request';
import movieRoutes from './movie';
import tvRoutes from './tv';
import mediaRoutes from './media';
import personRoutes from './person';

const router = Router();

router.use(checkUser);
router.use('/user', isAuthenticated(Permission.MANAGE_USERS), user);
router.get('/settings/public', (_req, res) => {
  const settings = getSettings();

  return res.status(200).json(settings.public);
});
router.use(
  '/settings',
  isAuthenticated(Permission.MANAGE_SETTINGS),
  settingsRoutes
);
router.use('/search', isAuthenticated(), searchRoutes);
router.use('/discover', isAuthenticated(), discoverRoutes);
router.use('/request', isAuthenticated(), requestRoutes);
router.use('/movie', isAuthenticated(), movieRoutes);
router.use('/tv', isAuthenticated(), tvRoutes);
router.use('/media', isAuthenticated(), mediaRoutes);
router.use('/person', isAuthenticated(), personRoutes);
router.use('/auth', authRoutes);

router.get('/', (_req, res) => {
  return res.status(200).json({
    api: 'Overseerr API',
    version: '1.0',
  });
});

export default router;
