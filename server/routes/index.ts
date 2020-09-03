import { Router } from 'express';
import user from './user';
import authRoutes from './auth';
import { checkUser, isAuthenticated } from '../middleware/auth';
import settingsRoutes from './settings';

const router = Router();

router.use(checkUser);
router.use('/user', isAuthenticated, user);
router.use('/settings', isAuthenticated, settingsRoutes);
router.use('/auth', authRoutes);

router.get('/', (req, res) => {
  return res.status(200).json({
    api: 'Overseerr API',
    version: '1.0',
  });
});

export default router;
