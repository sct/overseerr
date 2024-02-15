declare module 'nodebrainz' {
  import type {
    Artist,
    Group,
    Recording,
    Release,
    SearchOptions,
    Work,
  } from 'server/api/musicbrainz/interfaces';
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
  export default class BaseNodeBrainz {
    constructor(options: { userAgent: string });
    artist(artistId: string, { inc }: { inc: string }): Artist;
    recording(recordingId: string, { inc }: { inc: string }): Recording;
    release(releaseId: string, { inc }: { inc: string }): Release;
    releaseGroup(releaseGroupId: string, { inc }: { inc: string }): Group;
    work(workId: string, { inc }: { inc: string }): Work;
    search(
      type: string,
      search: SearchOptions,
      callback: (
        err: Error,
        data:
          | ArtistSearchResponse
          | ReleaseSearchResponse
          | RecordingSearchResponse
          | ReleaseGroupSearchResponse
          | WorkSearchResponse
      ) => void
    ): Promise<Artist[] | Release[] | Recording[] | Group[] | Work[]>;
  }
}
