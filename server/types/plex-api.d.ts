declare module 'plex-api' {
  export default class PlexAPI {
    constructor(intiialOptions: {
      hostname: string;
      port: number;
      token?: string;
      authenticator: {
        authenticate: (
          _plexApi: PlexAPI,
          cb: (err?: string, token?: string) => void
        ) => void;
      };
      options: {
        identifier: string;
        product: string;
        deviceName: string;
        platform: string;
      };
      requestOptions?: Record<string, string | number>;
    });

    query: <T extends Record<string, any>>(endpoint: string) => Promise<T>;
  }
}
