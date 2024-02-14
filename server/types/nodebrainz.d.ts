declare module 'nodebrainz' {
  import type {
    Artist,
    Group,
    Recording,
    Release,
    SearchOptions,
    Work,
  } from 'server/api/musicbrainz/interfaces';
  export default class BaseNodeBrainz {
    constructor(options: { userAgent: string });
    artist(artistId: string, { inc }: { inc: string }): Artist;
    recording(recordingId: string, { inc }: { inc: string }): Recording;
    release(releaseId: string, { inc }: { inc: string }): Release;
    releaseGroup(releaseGroupId: string, { inc }: { inc: string }): Group;
    work(workId: string, { inc }: { inc: string }): Work;
    search(
      type: string,
      search: SearchOptions
    ): Artist[] | Recording[] | Release[] | Group[] | Work[] | null;
  }
}
