import { BaseNodeBrainz } from 'nodebrainz';
import type { mbArtist, mbRecording, mbReleaseGroup, mbRelease, mbWork} from './interfaces';
import {mbArtistType, mbReleaseGroupType, mbWorkType} from './interfaces';

interface SearchOptions {
  query: string;
  page?: number;
  limit?: number;
  keywords?: string;
  artistname?: string;
  albumname?: string;
  recordingname?: string;
  tag?: string;
}

interface ArtistSearchOptions {
  query: string;
  tag?: string; // (part of) a tag attached to the artist
  limit?: number;
  offset?: number;
}

interface RecordingSearchOptions {
  query: string;
  tag?: string; // (part of) a tag attached to the recording
  artistname?: string; // (part of) the name of any of the recording artists
  release?: string; // the name of a release that the recording appears on
  offset?: number;
  limit?: number;
}

interface ReleaseSearchOptions {
  query: string;
  artistname?: string; // (part of) the name of any of the release artists
  tag?: string; // (part of) a tag attached to the release
  limit?: number;
  offset?: number;
}

interface ReleaseGroupSearchOptions {
  query: string;
  artistname?: string; // (part of) the name of any of the release group artists
  tag?: string; // (part of) a tag attached to the release group
  limit?: number;
  offset?: number;
}

interface WorkSearchOptions {
  query: string;
  artist?: string; // (part of) the name of an artist related to the work (e.g. a composer or lyricist)
  tag?: string; // (part of) a tag attached to the work
  limit?: number;
  offset?: number;
}

interface Tag {
  name: string;
  count: number;
}

interface Area {
  "sort-name": string
  "type-id": string
  "iso-3166-1-codes": string[]
  type: string
  disambiguation: string
  name: string
  id: string
}

interface Media {
  position: number
  "track-count": number
  format: string
  "format-id": string
  title: string
}

interface ReleaseEvent {
  area: Area
  date: string
}

interface RawArtist {
  "sort-name": string
  disambiguation: string
  id: string
  name: string
  "type-id": string
  type: string
}

interface RawRecording {
  length: number
  video: boolean
  title: string
  id: string
  disambiguation: string
  tags: Tag[]
}

interface RawReleaseGroup {
  tags: Tag[],
  "primary-type": string
  "secondary-types": string[]
  disambiguation: string
  "first-release-date": string
  "secondary-type-ids": string[]
  releases: any[]
  "primary-type-id": string
  id: string
  title: string
}

interface RawRelease {
  barcode: string
  tags: Tag[]
  disambiguation: string
  packaging: string
  "packaging-id": string
  "release-events": ReleaseEvent[]
  title: string
  status: string
  "text-representation": {
    language: string
    script: string
  }
  "status-id": string
  "release-group": any
  country: string
  quality: string
  date: string
  id: string
  media: Media[]
}

interface RawWork {
  disambiguation: string
  attributes: any[]
  id: string
  "type-id": string
  languages: string[]
  type: string
  tags: Tag[]
  iswcs: string[]
  title: string
  language: string
}

function searchOptionstoArtistSearchOptions(options: SearchOptions): ArtistSearchOptions {
  const data : ArtistSearchOptions = {
    query: options.query
  }
  if (options.tag) {
    data.tag = options.tag;
  }
  if (options.limit) {
    data.limit = options.limit;
  }
  else {
    data.limit = 25;
  }
  if (options.page) {
    data.offset = (options.page-1)*data.limit;
  }
  return data;
}

function searchOptionstoRecordingSearchOptions(options: SearchOptions): RecordingSearchOptions {
  const data : RecordingSearchOptions = {
    query: options.query
  }
  if (options.tag) {
    data.tag = options.tag;
  }
  if (options.artistname) {
    data.artistname = options.artistname;
  }
  if (options.albumname) {
    data.release = options.albumname;
  }
  if (options.limit) {
    data.limit = options.limit;
  }
  else {
    data.limit = 25;
  }
  if (options.page) {
    data.offset = (options.page-1)*data.limit;
  }
  return data;
}

function searchOptionstoReleaseSearchOptions(options: SearchOptions): ReleaseSearchOptions {
  const data : ReleaseSearchOptions = {
    query: options.query
  }
  if (options.artistname) {
    data.artistname = options.artistname;
  }
  if (options.tag) {
    data.tag = options.tag;
  }
  if (options.limit) {
    data.limit = options.limit;
  }
  else {
    data.limit = 25;
  }
  if (options.page) {
    data.offset = (options.page-1)*data.limit;
  }
  return data;
}

function searchOptionstoReleaseGroupSearchOptions(options: SearchOptions): ReleaseGroupSearchOptions {
  const data : ReleaseGroupSearchOptions = {
    query: options.query
  }
  if (options.artistname) {
    data.artistname = options.artistname;
  }
  if (options.tag) {
    data.tag = options.tag;
  }
  if (options.limit) {
    data.limit = options.limit;
  }
  else {
    data.limit = 25;
  }
  if (options.page) {
    data.offset = (options.page-1)*data.limit;
  }
  return data;
}

function searchOptionstoWorkSearchOptions(options: SearchOptions): WorkSearchOptions {
  const data : WorkSearchOptions = {
    query: options.query
  }
  if (options.artistname) {
    data.artist = options.artistname;
  }
  if (options.tag) {
    data.tag = options.tag;
  }
  if (options.limit) {
    data.limit = options.limit;
  }
  else {
    data.limit = 25;
  }
  if (options.page) {
    data.offset = (options.page-1)*data.limit;
  }
  return data;
}

class MusicBrainz extends BaseNodeBrainz {
  constructor() {
    super({userAgent:'Overseer-with-lidar-support/0.0.1 ( https://github.com/ano0002/overseerr )'});
  }

  public searchMulti = async (search: SearchOptions) => {
    try {
      const artistSearch = searchOptionstoArtistSearchOptions(search);
      const recordingSearch = searchOptionstoRecordingSearchOptions(search);
      const releaseGroupSearch = searchOptionstoReleaseGroupSearchOptions(search);
      const releaseSearch = searchOptionstoReleaseSearchOptions(search);
      const workSearch = searchOptionstoWorkSearchOptions(search);
      const artistResults = await this.searchArtists(artistSearch);
      const recordingResults = await this.searchRecordings(recordingSearch);
      const releaseGroupResults = await this.searchReleaseGroups(releaseGroupSearch);
      const releaseResults = await this.searchReleases(releaseSearch);
      const workResults = await this.searchWorks(workSearch);

      const combinedResults = {
        status: 'ok',
        artistResults,
        recordingResults,
        releaseGroupResults,
        releaseResults,
        workResults
      };

      return combinedResults;
    } catch (e) {
      return {
        status: 'error',
        artistResults: [],
        recordingResults: [],
        releaseGroupResults: [],
        releaseResults: [],
        workResults: []
      };
    }
  };

  public searchArtists = async (search: ArtistSearchOptions) => {
    try {
      const results = await this.search('artist', search);
      return results;
    } catch (e) {
      return [];
    }
  };

  public searchRecordings = async (search: RecordingSearchOptions) => {
    try {
      const results = await this.search('recording', search);
      return results;
    } catch (e) {
      return [];
    }
  };

  public searchReleaseGroups = async (search: ReleaseGroupSearchOptions) => {
    try {
      const results = await this.search('release-group', search);
      return results;
    } catch (e) {
      return [];
    }
  };

  public searchReleases = async (search: ReleaseSearchOptions) => {
    try {
      const results = await this.search('release', search);
      return results;
    } catch (e) {
      return [];
    }
  };

  public searchWorks = async (search: WorkSearchOptions) => {
    try {
      const results = await this.search('work', search);
      return results;
    } catch (e) {
      return [];
    }
  };

  public getArtist = async (artistId : string): Promise<mbArtist> => {
    try {
      const rawData = this.artist(artistId, {inc: 'tags+recordings+releases+release-groups+works'});
      const artist : mbArtist = {
        id: rawData.id,
        name: rawData.name,
        sortName: rawData["sort-name"],
        type: (rawData.type as mbArtistType) || mbArtistType.OTHER,
        recordings: rawData.recordings.map((recording: RawRecording): mbRecording => {
          return {
            id: recording.id,
            artist: [{
              id: rawData.id,
              name: rawData.name,
              sortName: rawData["sort-name"],
              type: (rawData.type as mbArtistType) || mbArtistType.OTHER,
              tags: rawData.tags.map((tag: Tag) => tag.name)
            }],
            title: recording.title,
            length: recording.length,
            tags: recording.tags.map((tag: Tag) => tag.name),
          }
        }),
        releases: rawData.releases.map((release: RawRelease): mbRelease => {
          return {
            id: release.id,
            artist: [{
              id: rawData.id,
              name: rawData.name,
              sortName: rawData["sort-name"],
              type: (rawData.type as mbArtistType) || mbArtistType.OTHER,
              tags: rawData.tags.map((tag: Tag) => tag.name)
            }],
            title: release.title,
            date: new Date(release.date),
            tags: release.tags.map((tag: Tag) => tag.name),
          }
        }),
        releaseGroups: rawData["release-groups"].map((releaseGroup: RawReleaseGroup): mbReleaseGroup => {
          return {
            id: releaseGroup.id,
            artist: [{
              id: rawData.id,
              name: rawData.name,
              sortName: rawData["sort-name"],
              type: (rawData.type as mbArtistType) || mbArtistType.OTHER,
              tags: rawData.tags.map((tag: Tag) => tag.name)
            }],
            title: releaseGroup.title,
            type: (releaseGroup["primary-type"] as mbReleaseGroupType) || mbReleaseGroupType.OTHER,
            firstReleased: new Date(releaseGroup["first-release-date"]),
            tags: releaseGroup.tags.map((tag: Tag) => tag.name),
          }
        }),
        works: rawData.works.map((work: RawWork): mbWork => {
          return {
            id: work.id,
            title: work.title,
            type: (work.type as mbWorkType) || mbWorkType.OTHER,
            artist: [{
              id: rawData.id,
              name: rawData.name,
              sortName: rawData["sort-name"],
              type: (rawData.type as mbArtistType) || mbArtistType.OTHER,
              tags: rawData.tags.map((tag: Tag) => tag.name)
            }],
            tags: work.tags.map((tag: Tag) => tag.name),
          }
        }),
        tags: rawData.tags.map((tag: Tag) => tag.name),
    };
      return artist;
    } catch (e) {
      throw new Error(`[MusicBrainz] Failed to fetch artist details: ${e.message}`);
    }
  };

  public getRecording = async (recordingId : string): Promise<mbRecording> => {
    try {
      const rawData = this.recording(recordingId, {inc: 'tags+artists+releases'});
      const recording : mbRecording = {
        id: rawData.id,
        title: rawData.title,
        artist: rawData["artist-credit"].map((artist: {artist: RawArtist}) => {
          return {
            id: artist.artist.id,
            name: artist.artist.name,
            sortName: artist.artist["sort-name"],
            type: (artist.artist.type as mbArtistType) || mbArtistType.OTHER
          }
        }),
        length: rawData.length,
        firstReleased: new Date(rawData["first-release-date"]),
        tags: rawData.tags.map((tag: Tag) => tag.name),
      };
      return recording;

    } catch (e) {
      throw new Error(`[MusicBrainz] Failed to fetch recording details: ${e.message}`);
    }
  };

  public async getReleaseGroup(releaseGroupId : string): Promise<mbReleaseGroup> {
    try {
      const rawData = this.releaseGroup(releaseGroupId, {inc: 'tags+artists+releases'});
      const releaseGroup : mbReleaseGroup = {
        id: rawData.id,
        title: rawData.title,
        artist: rawData["artist-credit"].map((artist: {artist: RawArtist}) => {
          return {
            id: artist.artist.id,
            name: artist.artist.name,
            sortName: artist.artist["sort-name"],
            type: (artist.artist.type as mbArtistType) || mbArtistType.OTHER
          }
        }),
        type: (rawData["primary-type"] as mbReleaseGroupType) || mbReleaseGroupType.OTHER,
        firstReleased: new Date(rawData["first-release-date"]),
        tags: rawData.tags.map((tag: Tag) => tag.name),
      };
      return releaseGroup;
    } catch (e) {
      throw new Error(`[MusicBrainz] Failed to fetch release group details: ${e.message}`);
    }
  };

  public async getRelease(releaseId : string): Promise<mbRelease> {
    try {
      const rawData = this.release(releaseId, {inc: 'tags+artists+recordings'});
      const release : mbRelease = {
        id: rawData.id,
        title: rawData.title,
        artist: rawData["artist-credit"].map((artist: {artist: RawArtist}) => {
          return {
            id: artist.artist.id,
            name: artist.artist.name,
            sortName: artist.artist["sort-name"],
            type: (artist.artist.type as mbArtistType) || mbArtistType.OTHER
          }
        }),
        date: new Date(rawData["release-events"][0].date),
        tracks: rawData.media.map((media: {
            "track-count": number
            title: string
            format: string
            position: number
            "track-offset": number
            tracks: {
              title: string
              position: number
              id: string
              length: number
              recording: {
                disambiguation: string
                "first-release-date": string
                title: string
                id: string
                length: number
                tags: Tag[]
                video: boolean
              }
              number: string
            }[];
            "format-id": string
          }) => {
            return media.tracks.map((track: {
              title: string
              position: number
              id: string
              length: number
              recording: {
                disambiguation: string
                "first-release-date": string
                title: string
                id: string
                length: number
                tags: Tag[]
                video: boolean
              }

              number: string
            }) => {
              return {
                id: track.id,
                title: track.title,
                length: track.recording.length,
                tags: track.recording.tags.map((tag: Tag) => tag.name),
              }
            })
          }).flat(),
        tags: rawData.tags.map((tag: Tag) => tag.name),
      };
      return release;
    } catch (e) {
      throw new Error(`[MusicBrainz] Failed to fetch release details: ${e.message}`);
    }
  };

  public async getWork(workId : string): Promise<mbWork> {
    try {
      const rawData = this.work(workId, {inc: 'tags+artist-rels'});
      const work : mbWork = {
        id: rawData.id,
        title: rawData.title,
        type: (rawData.type as mbWorkType) || mbWorkType.OTHER,
        artist: rawData.relations.map((relation: {artist: RawArtist}) => {
          return {
            id: relation.artist.id,
            name: relation.artist.name,
            sortName: relation.artist["sort-name"],
            type: (relation.artist.type as mbArtistType) || mbArtistType.OTHER
          }
        }),
        tags: rawData.tags.map((tag: Tag) => tag.name),
      };
      return work;
    } catch (e) {
      throw new Error(`[MusicBrainz] Failed to fetch work details: ${e.message}`);
    }
  };


}

export default MusicBrainz;
