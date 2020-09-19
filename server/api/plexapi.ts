import NodePlexAPI from 'plex-api';
import { getSettings } from '../lib/settings';

class PlexAPI {
  private plexClient: typeof NodePlexAPI;

  constructor({ plexToken }: { plexToken?: string }) {
    const settings = getSettings();

    this.plexClient = new NodePlexAPI({
      hostname: settings.plex.ip,
      post: settings.plex.port,
      token: plexToken,
      authenticator: {
        authenticate: (
          _plexApi: typeof PlexAPI,
          cb: (err?: string, token?: string) => void
        ) => {
          if (!plexToken) {
            return cb('Plex Token not found!');
          }
          cb(undefined, plexToken);
        },
      },
      options: {
        identifier: settings.clientId,
        product: 'Overseerr',
        deviceName: 'Overseerr',
        platform: 'Overseerr',
      },
    });
  }

  public async getStatus() {
    return await this.plexClient.query('/');
  }
}

export default PlexAPI;
