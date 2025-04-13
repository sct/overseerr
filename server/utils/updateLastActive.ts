import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';

export const updateLastActive = async (userId: number) => {
  const userRepository = getRepository(User);
  await userRepository.update(
    { id: userId },
    { lastActive: new Date().toISOString() }
  );
};
