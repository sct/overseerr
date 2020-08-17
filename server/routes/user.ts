import { Router } from 'express';
import { getRepository } from 'typeorm';
import { User } from '../entity/User';

const router = Router();

router.get('/', async (req, res) => {
  const userRepository = getRepository(User);

  const users = await userRepository.find();

  return res.status(200).json(users);
});

export default router;
