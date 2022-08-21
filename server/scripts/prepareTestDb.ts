import { copyFileSync } from 'fs';
import { UserType } from '../constants/user';
import { User } from '../entity/User';
import path from 'path';
import dataSource, { getRepository } from '../datasource';

const prepareDb = async () => {
  // Copy over test settings.json
  copyFileSync(
    path.join(__dirname, '../../cypress/config/settings.cypress.json'),
    path.join(__dirname, '../../config/settings.json')
  );

  // Connect to DB and seed test data
  const dbConnection = await dataSource.initialize();

  if (process.env.PRESERVE_DB !== 'true') {
    await dbConnection.dropDatabase();
  }

  // Run migrations in production
  if (process.env.WITH_MIGRATIONS === 'true') {
    await dbConnection.runMigrations();
  } else {
    await dbConnection.synchronize();
  }

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
  otherUser.plexToken = '1234';
  otherUser.plexUsername = 'friend';
  otherUser.username = 'friend';
  otherUser.email = 'friend@seerr.dev';
  otherUser.userType = UserType.PLEX;
  await otherUser.setPassword('test1234');
  otherUser.permissions = 32;
  otherUser.avatar = 'https://plex.tv/assets/images/avatar/default.png';
  await userRepository.save(otherUser);
};

prepareDb();
