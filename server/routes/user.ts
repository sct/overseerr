import { Router } from 'express';
import { getRepository } from 'typeorm';
import { User } from '../entity/User';

const router = Router();

router.get('/', async (req, res) => {
  const userRepository = getRepository(User);

  const users = await userRepository.find();

  return res.status(200).json(User.filterMany(users));
});

router.post('/', async (req, res, next) => {
  try {
    const userRepository = getRepository(User);

    const user = new User({
      email: req.body.email,
      permissions: req.body.permissions,
      plexToken: '',
    });
    await userRepository.save(user);
    return res.status(201).json(user.filter());
  } catch (e) {
    next({ status: 500, message: e.message });
  }
});

router.get<{ id: string }>('/:id', async (req, res, next) => {
  try {
    const userRepository = getRepository(User);

    const user = await userRepository.findOneOrFail({
      where: { id: Number(req.params.id) },
    });

    return res.status(200).json(user.filter());
  } catch (e) {
    next({ status: 404, message: 'User not found' });
  }
});

router.put<{ id: string }>('/:id', async (req, res, next) => {
  try {
    const userRepository = getRepository(User);

    const user = await userRepository.findOneOrFail({
      where: { id: Number(req.params.id) },
    });

    Object.assign(user, req.body);
    await userRepository.save(user);

    return res.status(200).json(user.filter());
  } catch (e) {
    next({ status: 404, message: 'User not found' });
  }
});

router.delete<{ id: string }>('/:id', async (req, res, next) => {
  try {
    const userRepository = getRepository(User);

    const user = await userRepository.findOneOrFail({
      where: { id: Number(req.params.id) },
    });
    await userRepository.delete(user.id);
    return res.status(200).json(user.filter());
  } catch (e) {
    next({ status: 404, message: 'User not found' });
  }
});

export default router;
