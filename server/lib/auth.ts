import { PlexTvAPI, type PlexUser } from '@server/api/plextv';
import { UserType } from '@server/constants/user';
import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import { Permission } from '@server/lib/permissions';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';

export enum PlexUserErrorCause {
  NotAuthorized = 'user has no access to the media server',
  AuthorizedNotImported = 'user has access to the media server, but has not yet been imported',
}

export interface PlexUserError {
  cause: PlexUserErrorCause;
  account: PlexUser;
}

const getUserByPlexAccount = async (
  account: PlexUser
): Promise<User | null> => {
  const userRepository = getRepository(User);

  return await userRepository
    .createQueryBuilder('user')
    .where('user.plexId = :id', { id: account.id })
    .orWhere('user.email = :email', {
      email: account.email.toLowerCase(),
    })
    .getOne();
};
const createPlexUser = async (
  account: PlexUser,
  permissions: Permission
): Promise<User> => {
  const userRepository = getRepository(User);

  const user = new User({
    email: account.email,
    plexUsername: account.username,
    plexId: account.id,
    plexToken: account.authToken,
    permissions: permissions,
    avatar: account.thumb,
    userType: UserType.PLEX,
  });

  await userRepository.save(user);

  return user;
};

const updateUserToPlexUser = async (user: User, account: PlexUser) => {
  const userRepository = getRepository(User);

  user.email = account.email;
  user.plexToken = account.authToken;
  user.plexId = account.id;
  user.avatar = account.thumb;
  user.plexUsername = account.username;
  user.userType = UserType.PLEX;

  await userRepository.save(user);
};

export const getOrCreatePlexUser = async (
  plexAuthToken: string
): Promise<User | PlexUserError> => {
  const settings = getSettings();
  const userRepository = getRepository(User);

  // First, we try to get the Plex user associated with the given authentication token, if any.
  const plextv = new PlexTvAPI(plexAuthToken);
  const account = await plextv.getUser();

  // Check to see if a local user already exists that is mapped to this Plex user, either by their
  // Plex account ID, or the e-mail attached to the account. If it does, we're done: just return the
  // user.
  let user = await getUserByPlexAccount(account);

  // If no such local user exists, and there are no other users at all, create one and assign it
  // as the administrator. This supports the initial setup experience as the user has to log in
  // anyways for us to query Plex servers to import.
  const anyUsersExist = (await userRepository.count()) > 0;
  if (!user && !anyUsersExist) {
    return await createPlexUser(account, Permission.ADMIN);
  }

  // We found an associated user, and it's the main user: we always grant access to the main user.
  if (user && user.id === 1) {
    return user;
  }

  // Check to see if the Plex account is authorized to access the main Plex machine associated with
  // this instance. Whether or not we found an associated user, if they aren't authorized, we don't
  // want to return their user object, or create a new one.
  const mainUser = await userRepository.findOneOrFail({
    select: { id: true, plexToken: true, plexId: true },
    where: { id: 1 },
  });
  const mainPlexTv = new PlexTvAPI(mainUser.plexToken ?? '');
  const plexAccountHasAccess = await mainPlexTv.checkUserAccess(account.id);
  if (!plexAccountHasAccess) {
    return {
      cause: PlexUserErrorCause.NotAuthorized,
      account: account,
    } as PlexUserError;
  }

  // If the Plex account is authorized, but we don't have a local user, we'll want to create one,
  // but we can only do that if "Enable New Plex Sign-In" is true.
  if (!user && !settings.main.newPlexLogin) {
    return {
      cause: PlexUserErrorCause.AuthorizedNotImported,
      account: account,
    } as PlexUserError;
  }

  if (user) {
    if (!user.plexId) {
      logger.info(
        'Imported Plex user logged in for the first time; updating Overseerr user with Plex account data',
        {
          label: 'API',
          email: user.email,
          userId: user.id,
          plexId: account.id,
          plexUsername: account.username,
        }
      );

      await updateUserToPlexUser(user, account);
    }
  } else {
    logger.info(
      'Sign-in attempt from Plex user with access to the media server; creating new Overseerr user',
      {
        label: 'API',
        email: account.email,
        plexId: account.id,
        plexUsername: account.username,
      }
    );

    user = await createPlexUser(account, settings.main.defaultPermissions);
  }
  return user;
};
