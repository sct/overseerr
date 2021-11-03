import axios, { AxiosInstance } from 'axios';
import { MediaType } from '../constants/media';
import { User } from '../entity/User';
import { TautulliSettings } from '../lib/settings';
import logger from '../logger';

export interface TautulliHistoryRecord {
  date: number;
  duration: number;
  friendly_name: string;
  full_title: string;
  grandparent_rating_key: number;
  grandparent_title: string;
  original_title: string;
  group_count: number;
  group_ids?: string;
  guid: string;
  ip_address: string;
  live: number;
  machine_id: string;
  media_index: number;
  media_type: string;
  originally_available_at: string;
  parent_media_index: number;
  parent_rating_key: number;
  parent_title: string;
  paused_counter: number;
  percent_complete: number;
  platform: string;
  product: string;
  player: string;
  rating_key: number;
  reference_id?: number;
  row_id?: number;
  session_key?: string;
  started: number;
  state?: string;
  stopped: number;
  thumb: string;
  title: string;
  transcode_decision: string;
  user: string;
  user_id: number;
  watched_status: number;
  year: number;
}

interface TautulliHistoryResponseData {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  total_duration: string;
  filter_duration: string;
  data: TautulliHistoryRecord[];
}

interface TautulliHistoryResponse {
  response: {
    result: string;
    message?: string;
    data: TautulliHistoryResponseData;
  };
}

interface TautulliUser {
  allow_guest: 0 | 1;
  deleted_user: 0 | 1;
  do_notify: 0 | 1;
  email?: string;
  friendly_name: string;
  is_active: 0 | 1;
  is_admin: 0 | 1;
  is_allow_sync?: 0 | 1;
  is_home_user?: 0 | 1;
  is_restricted?: 0 | 1;
  keep_history: 0 | 1;
  last_seen?: number;
  row_id: number;
  shared_libraries: string[];
  user_id: number;
  user_thumb: string;
  username: string;
}

interface TautulliUserResponse {
  response: { result: string; message?: string; data: TautulliUser };
}

export function parseDuration(duration: string): number {
  const regexp = new RegExp(
    /^(?:(?<days>\d+)\sdays?\s?)?(?:(?<hours>\d+)\shrs?\s?)?(?:(?<minutes>\d+)\smins?\s?)?(?:(?<seconds>\d+)\ssecs?)?$/
  );

  const groups = duration.match(regexp)?.groups;
  let durationVal = 0;

  if (groups) {
    if (groups.days) {
      durationVal += Number(groups.days) * 86400;
    }
    if (groups.hours) {
      durationVal += Number(groups.hours) * 3600;
    }
    if (groups.minutes) {
      durationVal += Number(groups.minutes) * 60;
    }
    if (groups.seconds) {
      durationVal += Number(groups.seconds);
    }
  }

  return durationVal;
}

class TautulliAPI {
  private axios: AxiosInstance;

  constructor(settings: TautulliSettings) {
    this.axios = axios.create({
      baseURL: `${settings.useSsl ? 'https' : 'http'}://${settings.hostname}:${
        settings.port
      }${settings.urlBase ?? ''}`,
      params: { apikey: settings.apiKey },
    });
  }

  public async getUser(userId: string): Promise<TautulliUser> {
    try {
      return (
        await this.axios.get<TautulliUserResponse>('/api/v2', {
          params: { cmd: 'get_user', user_id: userId },
        })
      ).data.response.data;
    } catch (e) {
      logger.error('Something went wrong fetching user from Tautulli', {
        label: 'Tautulli API',
        errorMessage: e.message,
        userId,
      });
      throw new Error(`[Tautulli] Failed to fetch user: ${e.message}`);
    }
  }

  public async getMediaWatchHistory(
    mediaType: MediaType,
    ratingKey: string
  ): Promise<TautulliHistoryResponseData> {
    let params: Record<string, unknown> = {
      cmd: 'get_history',
      grouping: 1,
      order_column: 'date',
      order_dir: 'desc',
      length: 100,
    };

    if (mediaType === MediaType.MOVIE) {
      params = { ...params, rating_key: ratingKey };
    } else if (mediaType === MediaType.TV) {
      params = { ...params, grandparent_rating_key: ratingKey };
    }

    try {
      return (
        await this.axios.get<TautulliHistoryResponse>('/api/v2', {
          params,
        })
      ).data.response.data;
    } catch (e) {
      logger.error(
        'Something went wrong fetching media watch history from Tautulli',
        {
          label: 'Tautulli API',
          errorMessage: e.message,
          mediaType,
          ratingKey,
        }
      );
      throw new Error(
        `[Tautulli] Failed to fetch media watch history: ${e.message}`
      );
    }
  }

  public async getUserWatchHistory(
    user: User
  ): Promise<TautulliHistoryResponseData> {
    try {
      if (!user.plexId) {
        throw new Error('User does not have an associated Plex ID');
      }

      return (
        await this.axios.get<TautulliHistoryResponse>('/api/v2', {
          params: {
            cmd: 'get_history',
            grouping: 1,
            order_column: 'date',
            order_dir: 'desc',
            user_id: user.plexId,
            length: 100,
          },
        })
      ).data.response.data;
    } catch (e) {
      logger.error(
        'Something went wrong fetching user watch history from Tautulli',
        {
          label: 'Tautulli API',
          errorMessage: e.message,
          user: user.displayName,
        }
      );
      throw new Error(
        `[Tautulli] Failed to fetch user watch history: ${e.message}`
      );
    }
  }
}

export default TautulliAPI;
