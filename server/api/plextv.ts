import axios, { AxiosInstance } from 'axios';

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
      console.error(
        'Something broke when getting account from plex.tv',
        e.message
      );
      throw new Error('Invalid auth token');
    }
  }
}

export default PlexTvAPI;
