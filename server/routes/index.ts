import { Router } from 'express';
import user from './user';
import authRoutes from './auth';
import { checkUser, isAuthenticated } from '../middleware/auth';
import settingsRoutes from './settings';
import { Permission } from '../lib/permissions';
import { getSettings } from '../lib/settings';

const router = Router();

router.use(checkUser);
router.use('/user', isAuthenticated(Permission.MANAGE_USERS), user);
router.use(
  '/settings',
  isAuthenticated(Permission.MANAGE_SETTINGS),
  settingsRoutes
);
router.use('/auth', authRoutes);

router.get('/settings/public', (_req, res) => {
  const settings = getSettings();

  return res.status(200).json(settings.public);
});

router.get('/', (_req, res) => {
  return res.status(200).json({
    api: 'Overseerr API',
    version: '1.0',
  });
});

export default router;
