import { Router } from 'express';
import user from './user';

const router = Router();

router.use('/user', user);

router.get('/', (req, res) => {
  return res.status(200).json({
    api: 'Overseerr API',
    version: '1.0',
  });
});

export default router;
