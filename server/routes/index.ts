import { Router } from 'express';
import user from './user';
import authRoutes from './auth';
import { checkUser, isAuthenticated } from '../middleware/auth';

const router = Router();

router.use(checkUser);
router.use('/user', isAuthenticated, user);
router.use('/auth', authRoutes);

router.get('/', (req, res) => {
  return res.status(200).json({
    api: 'Overseerr API',
    version: '1.0',
  });
});

router.all('*', (req, res) =>
  res.status(404).json({ status: 404, message: '404 Not Found' })
);

export default router;
