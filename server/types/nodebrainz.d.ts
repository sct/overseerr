declare module 'nodebrainz' {
  import type {
    Artist,
    Group,
    Recording,
    Release,
    SearchOptions,
    Work,
  } from '@server/api/musicbrainz/interfaces';
  interface RawSearchResponse {
    created: string;
    count: number;
    offset: number;
  }
  export interface ArtistSearchResponse extends RawSearchResponse {
    artists: Artist[];
  }
  export interface ReleaseSearchResponse extends RawSearchResponse {
    releases: Release[];
  }
  export interface RecordingSearchResponse extends RawSearchResponse {
    recordings: Recording[];
  }
  export interface ReleaseGroupSearchResponse extends RawSearchResponse {
    'release-groups': Group[];
  }
  export interface WorkSearchResponse extends RawSearchResponse {
    works: Work[];
  }

  export interface TagSearchResponse extends RawSearchResponse {
    tags: {
      score: number;
      name: string;
    }[];
  }

  export interface BrowseRequestParams {
    limit?: number;
    offset?: number;
    artist?: string;
    release?: string;
    recording?: string;
    'release-group'?: string;
    work?: string;
    // or anything else
    [key: string]: string | number | undefined;
  }

  export interface luceneSearchOptions {
    query: string;
    limit?: number;
    offset?: number;
  }

  export default class BaseNodeBrainz {
    constructor(options: {
      userAgent: string;
      retryOn: boolean;
      retryDelay: number;
      retryCount: number;
    });
    artist(
      artistId: string,
      { inc }: { inc: string },
      callback: (err: Error, data: Artist) => void
    ): Promise<Artist>;
    recording(
      recordingId: string,
      { inc }: { inc: string },
      callback: (err: Error, data: Recording) => void
    ): Promise<Recording>;
    release(
      releaseId: string,
      { inc }: { inc: string },
      callback: (err: Error, data: Release) => void
    ): Promise<Release>;
    releaseGroup(
      releaseGroupId: string,
      { inc }: { inc: string },
      callback: (err: Error, data: Group) => void
    ): Promise<Group>;
    work(
      workId: string,
      { inc }: { inc: string },
      callback: (err: Error, data: Work) => void
    ): Promise<Work>;
    search(
      type: string,
      search: SearchOptions | { tag: string },
      callback: (
        err: Error,
        data:
          | ArtistSearchResponse
          | ReleaseSearchResponse
          | RecordingSearchResponse
          | ReleaseGroupSearchResponse
          | WorkSearchResponse
          | TagSearchResponse
      ) => void
    ): Promise<Artist[] | Release[] | Recording[] | Group[] | Work[]>;
    browse(
      type: string,
      data: BrowseRequestParams,
      callback: (
        err: Error,
        data:
          | {
              'release-group-count': number;
              'release-group-offset': number;
              'release-groups': Group[];
            }
          | {
              'release-count': number;
              'release-offset': number;
              releases: Release[];
            }
          | {
              'recording-count': number;
              'recording-offset': number;
              recordings: Recording[];
            }
          | {
              'work-count': number;
              'work-offset': number;
              works: Work[];
            }
          | {
              'artist-count': number;
              'artist-offset': number;
              artists: Artist[];
            }
      ) => void
    ): Promise<Artist[] | Release[] | Recording[] | Group[] | Work[]>;
    luceneSearch(
      type: string,
      search: luceneSearchOptions,
      callback: (
        err: Error,
        data:
          | ArtistSearchResponse
          | ReleaseSearchResponse
          | RecordingSearchResponse
          | ReleaseGroupSearchResponse
          | WorkSearchResponse
          | TagSearchResponse
      ) => void
    ): Promise<Artist[] | Release[] | Recording[] | Group[] | Work[]>;
  }
}
