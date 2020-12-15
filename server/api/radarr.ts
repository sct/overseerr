import Axios, { AxiosInstance } from 'axios';
import logger from '../logger';

interface RadarrMovieOptions {
  title: string;
  qualityProfileId: number;
  minimumAvailability: string;
  profileId: number;
  year: number;
  rootFolderPath: string;
  tmdbId: number;
  monitored?: boolean;
  searchNow?: boolean;
}

interface RadarrMovie {
  id: number;
  title: string;
  isAvailable: boolean;
  monitored: boolean;
  tmdbId: number;
  titleSlug: string;
  folderName: string;
  path: string;
  profileId: number;
  qualityProfileId: number;
  added: string;
  downloaded: boolean;
  hasFile: boolean;
}

interface RadarrRootFolder {
  id: number;
  path: string;
  freeSpace: number;
  totalSpace: number;
  unmappedFolders: {
    name: string;
    path: string;
  }[];
}

interface RadarrProfile {
  id: number;
  name: string;
}

class RadarrAPI {
  private axios: AxiosInstance;
  constructor({ url, apiKey }: { url: string; apiKey: string }) {
    this.axios = Axios.create({
      baseURL: url,
      params: {
        apikey: apiKey,
      },
    });
  }

  public getMovies = async (): Promise<RadarrMovie[]> => {
    try {
      const response = await this.axios.get<RadarrMovie[]>('/movie');

      return response.data;
    } catch (e) {
      throw new Error(`[Radarr] Failed to retrieve movies: ${e.message}`);
    }
  };

  public getMovie = async ({ id }: { id: number }): Promise<RadarrMovie> => {
    try {
      const response = await this.axios.get<RadarrMovie>(`/movie/${id}`);

      return response.data;
    } catch (e) {
      throw new Error(`[Radarr] Failed to retrieve movie: ${e.message}`);
    }
  };

  public addMovie = async (options: RadarrMovieOptions): Promise<void> => {
    try {
      await this.axios.post<RadarrMovie>(`/movie`, {
        title: options.title,
        qualityProfileId: options.qualityProfileId,
        profileId: options.profileId,
        titleSlug: options.tmdbId.toString(),
        minimumAvailability: options.minimumAvailability,
        tmdbId: options.tmdbId,
        year: options.year,
        rootFolderPath: options.rootFolderPath,
        monitored: options.monitored,
        addOptions: {
          searchForMovie: options.searchNow,
        },
      });
    } catch (e) {
      logger.error(
        'Failed to add movie to Radarr. This might happen if the movie already exists, in which case you can safely ignore this error.',
        {
          label: 'Radarr',
          errorMessage: e.message,
          options,
        }
      );
    }
  };

  public getProfiles = async (): Promise<RadarrProfile[]> => {
    try {
      const response = await this.axios.get<RadarrProfile[]>(`/profile`);

      return response.data;
    } catch (e) {
      throw new Error(`[Radarr] Failed to retrieve profiles: ${e.message}`);
    }
  };

  public getRootFolders = async (): Promise<RadarrRootFolder[]> => {
    try {
      const response = await this.axios.get<RadarrRootFolder[]>(`/rootfolder`);

      return response.data;
    } catch (e) {
      throw new Error(`[Radarr] Failed to retrieve root folders: ${e.message}`);
    }
  };
}

export default RadarrAPI;
