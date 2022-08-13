import { createConnection, getRepository } from 'typeorm';
import { UserType } from '../constants/user';
import { User } from '../entity/User';

const prepareDb = async () => {
  const dbConnection = await createConnection();

  await dbConnection.dropDatabase();
  await dbConnection.synchronize();

  const userRepository = getRepository(User);

  // Create the admin user
  const user = new User();
  user.plexId = 1;
  user.plexToken = '1234';
  user.plexUsername = 'admin';
  user.username = 'admin';
  user.email = 'admin@seerr.dev';
  user.userType = UserType.PLEX;
  await user.setPassword('test1234');
  user.permissions = 2;
  user.avatar = 'https://plex.tv/assets/images/avatar/default.png';
  await userRepository.save(user);

  // Create the other user
  const otherUser = new User();
  otherUser.plexId = 1;
  otherUser.username = 'friend';
  otherUser.email = 'friend@seerr.dev';
  otherUser.userType = UserType.LOCAL;
  await otherUser.setPassword('test1234');
  otherUser.permissions = 32;
  otherUser.avatar = 'https://plex.tv/assets/images/avatar/default.png';
  await userRepository.save(otherUser);
};

prepareDb();
