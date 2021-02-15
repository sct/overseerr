/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosInstance } from 'axios';
import logger from '../logger';

export interface JellyfinUserResponse {
  Name: string;
  ServerId: string;
  ServerName: string;
  Id: string;
  PrimaryImageTag?: string;
}

export interface JellyfinLoginResponse {
  User: JellyfinUserResponse;
  AccessToken: string;
}
export interface JellyfinLibrary {
  type: 'show' | 'movie';
  key: string;
  title: string;
  agent: string;
}

export interface JellyfinLibraryItem {
  Name: string;
  Id: string;
  HasSubtitles: boolean;
  Type: 'Movie' | 'Episode' | 'Season' | 'Series';
  SeriesName?: string;
  SeriesId?: string;
  SeasonId?: string;
  SeasonName?: string;
  IndexNumber?: number;
  ParentIndexNumber?: number;
  MediaType: string;
}

export interface JellyfinMediaStream {
  Codec: string;
  Type: 'Video' | 'Audio' | 'Subtitle';
  Height?: number;
  Width?: number;
  AverageFrameRate?: number;
  RealFrameRate?: number;
  Language?: string;
  DisplayTitle: string;
}
export interface JellyfinMediaSource {
  Protocol: string;
  Id: string;
  Path: string;
  Type: string;
  VideoType: string;
  MediaStreams: JellyfinMediaStream[];
}

export interface JellyfinLibraryItemExtended extends JellyfinLibraryItem {
  ProviderIds: {
    Tmdb?: string;
    Imdb?: string;
    Tvdb?: string;
  };
  MediaSources?: JellyfinMediaSource[];
  Width?: number;
  Height?: number;
  IsHD?: boolean;
  DateCreated?: string;
}
class JellyfinAPI {
  private authToken?: string;
  private jellyfinHost: string;
  private axios: AxiosInstance;

  constructor(jellyfinHost: string, authToken?: string) {
    this.jellyfinHost = jellyfinHost;
    this.authToken = authToken;

    let authHeaderVal = '';
    if (this.authToken) {
      authHeaderVal =
        'MediaBrowser Client="Jellyfin Web", Device="Firefox", DeviceId="TW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NDsgcnY6ODUuMCkgR2Vja28vMjAxMDAxMDEgRmlyZWZveC84NS4wfDE2MTI5MjcyMDM5NzM1", Version="10.8.0", Token="' +
        authToken +
        '"';
    } else {
      authHeaderVal =
        'MediaBrowser Client="Jellyfin Web", Device="Firefox", DeviceId="TW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NDsgcnY6ODUuMCkgR2Vja28vMjAxMDAxMDEgRmlyZWZveC84NS4wfDE2MTI5MjcyMDM5NzM1", Version="10.8.0"';
    }

    this.axios = axios.create({
      baseURL: this.jellyfinHost,
      headers: {
        'X-Emby-Authorization': authHeaderVal,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  public async login(
    Username?: string,
    Password?: string
  ): Promise<JellyfinLoginResponse> {
    try {
      const account = await this.axios.post<JellyfinLoginResponse>(
        '/Users/AuthenticateByName',
        {
          Username: Username,
          Pw: Password,
        }
      );
      return account.data;
    } catch (e) {
      throw new Error('Unauthorized');
    }
  }

  public async getUser(): Promise<JellyfinUserResponse> {
    try {
      const account = await this.axios.get<JellyfinUserResponse>('/Users/Me');
      return account.data;
    } catch (e) {
      logger.error(
        `Something went wrong while getting the account from the Jellyfin server: ${e.message}`,
        { label: 'Jellyfin API' }
      );
      throw new Error('Invalid auth token');
    }
  }

  public async getLibraries(): Promise<JellyfinLibrary[]> {
    try {
      const account = await this.axios.get<any>('/Library/MediaFolders');

      // eslint-disable-next-line prefer-const
      let response: JellyfinLibrary[] = [];

      account.data.Items.forEach((Item: any) => {
        const library: JellyfinLibrary = {
          key: Item.Id,
          title: Item.Name,
          type: Item.CollectionType == 'movies' ? 'movie' : 'show',
          agent: 'jellyfin',
        };

        if (Item.Type == 'CollectionFolder') {
          response.push(library);
        }
      });

      return response;
    } catch (e) {
      logger.error(
        `Something went wrong while getting libraries from the Jellyfin server: ${e.message}`,
        { label: 'Jellyfin API' }
      );
      throw new Error('Invalid auth token');
    }
  }

  public async getLibraryContents(id: string): Promise<JellyfinLibraryItem[]> {
    try {
      const contents = await this.axios.get<any>(
        `/Users/${
          (await this.getUser()).Id
        }/Items?SortBy=SortName&SortOrder=Ascending&Recursive=true&StartIndex=0&ParentId=${id}`
      );

      return contents.data.Items;
    } catch (e) {
      logger.error(
        `Something went wrong while getting library content from the Jellyfin server: ${e.message}`,
        { label: 'Jellyfin API' }
      );
      throw new Error('Invalid auth token');
    }
  }

  public async getRecentlyAdded(id: string): Promise<JellyfinLibraryItem[]> {
    try {
      const contents = await this.axios.get<any>(
        `/Users/${
          (await this.getUser()).Id
        }/Items/Latest?Limit=50&ParentId=${id}`
      );

      return contents.data.Items;
    } catch (e) {
      logger.error(
        `Something went wrong while getting library content from the Jellyfin server: ${e.message}`,
        { label: 'Jellyfin API' }
      );
      throw new Error('Invalid auth token');
    }
  }

  public async getItemData(id: string): Promise<JellyfinLibraryItemExtended> {
    try {
      const contents = await this.axios.get<any>(
        `/Users/${(await this.getUser()).Id}/Items/${id}`
      );

      return contents.data;
    } catch (e) {
      logger.error(
        `Something went wrong while getting library content from the Jellyfin server: ${e.message}`,
        { label: 'Jellyfin API' }
      );
      throw new Error('Invalid auth token');
    }
  }

  public async getSeasons(seriesID: string): Promise<JellyfinLibraryItem[]> {
    try {
      const contents = await this.axios.get<any>(`/Shows/${seriesID}/Seasons`);

      return contents.data.Items;
    } catch (e) {
      logger.error(
        `Something went wrong while getting the list of seasons from the Jellyfin server: ${e.message}`,
        { label: 'Jellyfin API' }
      );
      throw new Error('Invalid auth token');
    }
  }

  public async getEpisodes(
    seriesID: string,
    seasonID: string
  ): Promise<JellyfinLibraryItem[]> {
    try {
      const contents = await this.axios.get<any>(
        `/Shows/${seriesID}/Episodes?seasonId=${seasonID}`
      );

      return contents.data.Items;
    } catch (e) {
      logger.error(
        `Something went wrong while getting the list of episodes from the Jellyfin server: ${e.message}`,
        { label: 'Jellyfin API' }
      );
      throw new Error('Invalid auth token');
    }
  }
}

export default JellyfinAPI;
