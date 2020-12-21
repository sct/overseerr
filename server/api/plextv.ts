import axios, { AxiosInstance } from 'axios';
import xml2js from 'xml2js';
import { getSettings } from '../lib/settings';
import logger from '../logger';

interface PlexAccountResponse {
  user: PlexUser;
}

interface PlexUser {
  id: number;
  uuid: string;
  email: string;
  joined_at: string;
  username: string;
  title: string;
  thumb: string;
  hasPassword: boolean;
  authToken: string;
  subscription: {
    active: boolean;
    status: string;
    plan: string;
    features: string[];
  };
  roles: {
    roles: string[];
  };
  entitlements: string[];
}

interface ServerResponse {
  $: {
    id: string;
    serverId: string;
    machineIdentifier: string;
    name: string;
    lastSeenAt: string;
    numLibraries: string;
    owned: string;
  };
}

interface FriendResponse {
  MediaContainer: {
    User: {
      $: {
        id: string;
        title: string;
        username: string;
        email: string;
        thumb: string;
      };
      Server: ServerResponse[];
    }[];
  };
}

interface UsersResponse {
  MediaContainer: {
    User: {
      $: {
        id: string;
        title: string;
        username: string;
        email: string;
        thumb: string;
      };
      Server: ServerResponse[];
    }[];
  };
}

class PlexTvAPI {
  private authToken: string;
  private axios: AxiosInstance;

  constructor(authToken: string) {
    this.authToken = authToken;
    this.axios = axios.create({
      baseURL: 'https://plex.tv',
      headers: {
        'X-Plex-Token': this.authToken,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  public async getUser(): Promise<PlexUser> {
    try {
      const account = await this.axios.get<PlexAccountResponse>(
        '/users/account.json'
      );

      return account.data.user;
    } catch (e) {
      logger.error(
        `Something went wrong getting the account from plex.tv: ${e.message}`,
        { label: 'Plex.tv API' }
      );
      throw new Error('Invalid auth token');
    }
  }

  public async getFriends(): Promise<FriendResponse> {
    const response = await this.axios.get('/pms/friends/all', {
      transformResponse: [],
      responseType: 'text',
    });

    const parsedXml = (await xml2js.parseStringPromise(
      response.data
    )) as FriendResponse;

    return parsedXml;
  }

  public async checkUserAccess(authUser: PlexUser): Promise<boolean> {
    const settings = getSettings();

    try {
      if (!settings.plex.machineId) {
        throw new Error('Plex is not configured!');
      }

      const friends = await this.getFriends();

      const users = friends.MediaContainer.User;

      const user = users.find((u) => Number(u.$.id) === authUser.id);

      if (!user) {
        throw new Error(
          'This user does not exist on the main plex accounts shared list'
        );
      }

      return !!user.Server.find(
        (server) => server.$.machineIdentifier === settings.plex.machineId
      );
    } catch (e) {
      logger.error(`Error checking user access: ${e.message}`);
      return false;
    }
  }

  public async getUsers(): Promise<UsersResponse> {
    const response = await this.axios.get('/api/users', {
      transformResponse: [],
      responseType: 'text',
    });

    const parsedXml = (await xml2js.parseStringPromise(
      response.data
    )) as UsersResponse;
    return parsedXml;
  }
}

export default PlexTvAPI;
