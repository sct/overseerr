import logger from '@server/logger';
import type {
  ArtistSearchResponse,
  RecordingSearchResponse,
  ReleaseGroupSearchResponse,
  ReleaseSearchResponse,
  WorkSearchResponse,
} from 'nodebrainz';
import BaseNodeBrainz from 'nodebrainz';
import type {
  Artist,
  ArtistCredit,
  Group,
  mbArtist,
  mbRecording,
  mbRelease,
  mbReleaseGroup,
  mbWork,
  Medium,
  Recording,
  Relation,
  Release,
  SearchOptions,
  Tag,
  Track,
  Work,
} from './interfaces';
import { mbArtistType, mbReleaseGroupType, mbWorkType } from './interfaces';

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

function searchOptionstoArtistSearchOptions(
  options: SearchOptions
): ArtistSearchOptions {
  const data: ArtistSearchOptions = {
    query: options.query,
  };
  if (options.tag) {
    data.tag = options.tag;
  }
  if (options.limit) {
    data.limit = options.limit;
  } else {
    data.limit = 25;
  }
  if (options.page) {
    data.offset = (options.page - 1) * data.limit;
  }
  return data;
}

function searchOptionstoRecordingSearchOptions(
  options: SearchOptions
): RecordingSearchOptions {
  const data: RecordingSearchOptions = {
    query: options.query,
  };
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
  } else {
    data.limit = 25;
  }
  if (options.page) {
    data.offset = (options.page - 1) * data.limit;
  }
  return data;
}

function searchOptionstoReleaseSearchOptions(
  options: SearchOptions
): ReleaseSearchOptions {
  const data: ReleaseSearchOptions = {
    query: options.query,
  };
  if (options.artistname) {
    data.artistname = options.artistname;
  }
  if (options.tag) {
    data.tag = options.tag;
  }
  if (options.limit) {
    data.limit = options.limit;
  } else {
    data.limit = 25;
  }
  if (options.page) {
    data.offset = (options.page - 1) * data.limit;
  }
  return data;
}

function searchOptionstoReleaseGroupSearchOptions(
  options: SearchOptions
): ReleaseGroupSearchOptions {
  const data: ReleaseGroupSearchOptions = {
    query: options.query,
  };
  if (options.artistname) {
    data.artistname = options.artistname;
  }
  if (options.tag) {
    data.tag = options.tag;
  }
  if (options.limit) {
    data.limit = options.limit;
  } else {
    data.limit = 25;
  }
  if (options.page) {
    data.offset = (options.page - 1) * data.limit;
  }
  return data;
}

function searchOptionstoWorkSearchOptions(
  options: SearchOptions
): WorkSearchOptions {
  const data: WorkSearchOptions = {
    query: options.query,
  };
  if (options.artistname) {
    data.artist = options.artistname;
  }
  if (options.tag) {
    data.tag = options.tag;
  }
  if (options.limit) {
    data.limit = options.limit;
  } else {
    data.limit = 25;
  }
  if (options.page) {
    data.offset = (options.page - 1) * data.limit;
  }
  return data;
}

function convertRelease(release: Release): mbRelease {
  return {
    media_type: 'release',
    id: release.id,
    title: release.title,
    artist: (release['artist-credit'] ?? []).map(convertArtistCredit),
    date:
      release['release-events'] && release['release-events'].length > 0
        ? new Date(String(release['release-events'][0].date))
        : undefined,
    tracks: (release.media ?? []).flatMap(convertMedium),
    tags: (release.tags ?? []).map(convertTag),
    releaseGroupType: release['release-group']?.['primary-type'] || 'Other',
  };
}

function convertReleaseGroup(releaseGroup: Group): mbReleaseGroup {
  return {
    media_type: 'release-group',
    id: releaseGroup.id,
    title: releaseGroup.title,
    artist: (releaseGroup['artist-credit'] ?? []).map(convertArtistCredit),
    releases: (releaseGroup.releases ?? []).map(convertRelease),
    type:
      (releaseGroup['primary-type'] as mbReleaseGroupType) ||
      mbReleaseGroupType.OTHER,
    firstReleased: new Date(releaseGroup['first-release-date']),
    tags: (releaseGroup.tags ?? []).map((tag: Tag) => tag.name),
  };
}

function convertRecording(recording: Recording): mbRecording {
  return {
    media_type: 'recording',
    id: recording.id,
    title: recording.title,
    artist: (recording['artist-credit'] ?? []).map(convertArtistCredit),
    length: recording.length,
    firstReleased: new Date(recording['first-release-date']),
    tags: (recording.tags ?? []).map(convertTag),
  };
}

function convertArtist(artist: Artist): mbArtist {
  return {
    media_type: 'artist',
    id: artist.id,
    name: artist.name,
    sortName: artist['sort-name'],
    type: (artist.type as mbArtistType) || mbArtistType.OTHER,
    recordings: (artist.recordings ?? []).map(convertRecording),
    releases: (artist.releases ?? []).map(convertRelease),
    releaseGroups: (artist['release-groups'] ?? []).map(convertReleaseGroup),
    works: (artist.works ?? []).map(convertWork),
    tags: (artist.tags ?? []).map(convertTag),
  };
}

function convertWork(work: Work): mbWork {
  return {
    media_type: 'work',
    id: work.id,
    title: work.title,
    type: (work.type as mbWorkType) || mbWorkType.OTHER,
    artist: (work.relations ?? []).map(convertRelation),
    tags: (work.tags ?? []).map(convertTag),
  };
}

function convertArtistCredit(artistCredit: ArtistCredit): mbArtist {
  return {
    media_type: 'artist',
    id: artistCredit.artist.id,
    name: artistCredit.artist.name,
    sortName: artistCredit.artist['sort-name'],
    type: (artistCredit.artist.type as mbArtistType) || mbArtistType.OTHER,
    tags: (artistCredit.artist.tags ?? []).map(convertTag),
  };
}

function convertRelation(relation: Relation): mbArtist {
  return {
    media_type: 'artist',
    id: relation.artist.id,
    name: relation.artist.name,
    sortName: relation.artist['sort-name'],
    type: (relation.artist.type as mbArtistType) || mbArtistType.OTHER,
    tags: (relation.artist.tags ?? []).map(convertTag),
  };
}

function convertTag(tag: Tag): string {
  return tag.name;
}

function convertMedium(medium: Medium): mbRecording[] {
  return (medium.tracks ?? []).map(convertTrack);
}

function convertTrack(track: Track): mbRecording {
  return {
    media_type: 'recording',
    id: track.id,
    title: track.title,
    artist: (track.recording['artist-credit'] ?? []).map(convertArtistCredit),
    length: track.recording.length,
    tags: (track.recording.tags ?? []).map(convertTag),
  };
}

class MusicBrainz extends BaseNodeBrainz {
  constructor() {
    super({
      userAgent:
        'Overseer-with-lidar-support/0.1 ( https://github.com/ano0002/overseerr )',
      retryOn: true,
      retryDelay: 3000,
      retryCount: 3,
    });
  }

  public searchMulti = async (search: SearchOptions) => {
    try {
      const artistSearch = searchOptionstoArtistSearchOptions(search);
      const recordingSearch = searchOptionstoRecordingSearchOptions(search);
      const releaseGroupSearch =
        searchOptionstoReleaseGroupSearchOptions(search);
      const releaseSearch = searchOptionstoReleaseSearchOptions(search);
      const workSearch = searchOptionstoWorkSearchOptions(search);
      const artistResults = await this.searchArtists(artistSearch);
      const recordingResults = await this.searchRecordings(recordingSearch);
      const releaseGroupResults = await this.searchReleaseGroups(
        releaseGroupSearch
      );
      const releaseResults = await this.searchReleases(releaseSearch);
      const workResults = await this.searchWorks(workSearch);

      const combinedResults = {
        status: 'ok',
        artistResults,
        recordingResults,
        releaseGroupResults,
        releaseResults,
        workResults,
      };

      return combinedResults;
    } catch (e) {
      return {
        status: 'error',
        artistResults: [],
        recordingResults: [],
        releaseGroupResults: [],
        releaseResults: [],
        workResults: [],
      };
    }
  };

  public searchArtists = async (
    search: ArtistSearchOptions
  ): Promise<mbArtist[]> => {
    try {
      return await new Promise<mbArtist[]>((resolve, reject) => {
        this.search('artist', search, (error, data) => {
          if (error) {
            reject(error);
          } else {
            const rawResults = data as unknown as ArtistSearchResponse;
            const results = rawResults.artists.map(convertArtist);
            resolve(results);
          }
        });
      });
    } catch (e) {
      logger.error('Failed to search for artists', {
        label: 'MusicBrainz',
        message: e.message,
      });
      return new Promise<mbArtist[]>((resolve) => resolve([]));
    }
  };

  public searchRecordings = async (
    search: RecordingSearchOptions
  ): Promise<mbRecording[]> => {
    try {
      return await new Promise<mbRecording[]>((resolve, reject) => {
        this.search('recording', search, (error, data) => {
          if (error) {
            reject(error);
          } else {
            const rawResults = data as unknown as RecordingSearchResponse;
            const results = rawResults.recordings.map(convertRecording);
            resolve(results);
          }
        });
      });
    } catch (e) {
      logger.error('Failed to search for recordings', {
        label: 'MusicBrainz',
        message: e.message,
      });
      return new Promise<mbRecording[]>((resolve) => resolve([]));
    }
  };

  public searchReleaseGroups = (
    search: ReleaseGroupSearchOptions
  ): Promise<mbReleaseGroup[]> => {
    try {
      return new Promise<mbReleaseGroup[]>((resolve, reject) => {
        this.search('release-group', search, (error, data) => {
          if (error) {
            reject(error);
          } else {
            const rawResults = data as unknown as ReleaseGroupSearchResponse;
            const results =
              rawResults['release-groups'].map(convertReleaseGroup);
            resolve(results);
          }
        });
      });
    } catch (e) {
      logger.error('Failed to search for release groups', {
        label: 'MusicBrainz',
        message: e.message,
      });
      return new Promise<mbReleaseGroup[]>((resolve) => resolve([]));
    }
  };

  public searchReleases = (
    search: ReleaseSearchOptions
  ): Promise<mbRelease[]> => {
    try {
      return new Promise<mbRelease[]>((resolve, reject) => {
        this.search('release', search, (error, data) => {
          if (error) {
            reject(error);
          } else {
            const rawResults = data as unknown as ReleaseSearchResponse;
            const results = rawResults.releases.map(convertRelease);
            resolve(results);
          }
        });
      });
    } catch (e) {
      logger.error('Failed to search for releases', {
        label: 'MusicBrainz',
        message: e.message,
      });
      return new Promise<mbRelease[]>((resolve) => resolve([]));
    }
  };

  public searchWorks = (search: WorkSearchOptions): Promise<mbWork[]> => {
    try {
      return new Promise<mbWork[]>((resolve, reject) => {
        this.search('work', search, (error, data) => {
          if (error) {
            reject(error);
          } else {
            const rawResults = data as unknown as WorkSearchResponse;
            const results = rawResults.works.map(convertWork);
            resolve(results);
          }
        });
      });
    } catch (e) {
      logger.error('Failed to search for works', {
        label: 'MusicBrainz',
        message: e.message,
      });
      return new Promise<mbWork[]>((resolve) => resolve([]));
    }
  };

  public getArtist = (artistId: string): Promise<mbArtist> => {
    try {
      return new Promise<mbArtist>((resolve, reject) => {
        this.artist(
          artistId,
          {
            inc: 'tags+recordings+releases+release-groups+works',
          },
          (error, data) => {
            if (error) {
              reject(error);
            } else {
              const results = convertArtist(data as Artist);
              resolve(results);
            }
          }
        );
      });
    } catch (e) {
      logger.error('Failed to get artist', {
        label: 'MusicBrainz',
        message: e.message,
      });
      return new Promise<mbArtist>((resolve) => resolve({} as mbArtist));
    }
  };

  public getFullArtist = (
    artistId: string,
    maxElements = 25,
    startOffset = 0
  ): Promise<mbArtist> => {
    try {
      return new Promise<mbArtist>((resolve, reject) => {
        this.artist(
          artistId,
          {
            inc: 'tags',
          },
          async (error, data) => {
            if (error) {
              reject(error);
            } else {
              const results = convertArtist(data as Artist);
              results.releaseGroups = await this.getReleaseGroups(
                artistId,
                maxElements,
                startOffset
              );
              results.releases = await this.getReleases(
                artistId,
                maxElements,
                startOffset
              );
              results.recordings = await this.getRecordings(
                artistId,
                maxElements,
                startOffset
              );
              results.works = await this.getWorks(
                artistId,
                maxElements,
                startOffset
              );
              resolve(results);
            }
          }
        );
      });
    } catch (e) {
      logger.error('Failed to get full artist', {
        label: 'MusicBrainz',
        message: e.message,
      });
      return new Promise<mbArtist>((resolve) => resolve({} as mbArtist));
    }
  };

  public getRecordings = (
    artistId: string,
    maxElements = 50,
    startOffset = 0
  ): Promise<mbRecording[]> => {
    try {
      return new Promise<mbRecording[]>((resolve, reject) => {
        this.browse(
          'recording',
          { artist: artistId, offset: startOffset },
          async (error, data) => {
            if (error) {
              reject(error);
            } else {
              data = data as {
                'recording-count': number;
                'recording-offset': number;
                recordings: Recording[];
              };
              // Get the first 25 results
              const total = data['recording-count'];
              let results: mbRecording[] =
                data.recordings.map(convertRecording);

              // Slice the results into smaller chunks to avoid hitting the limit of 100

              for (
                let i = data.recordings.length + startOffset;
                i < total && i < maxElements;
                i += 100
              ) {
                results = results.concat(
                  await new Promise<mbRecording[]>((resolve2, reject2) => {
                    this.browse(
                      'recording',
                      {
                        artist: artistId,
                        offset: i,
                        limit: 100,
                      },
                      (error, data) => {
                        if (error) {
                          reject2(error);
                        } else {
                          const results = (
                            (
                              data as {
                                'recording-count': number;
                                'recording-offset': number;
                                recordings: Recording[];
                              }
                            ).recordings ?? []
                          ).map(convertRecording);
                          resolve2(results);
                        }
                      }
                    );
                  })
                );
              }
              results = results.reduce((arr: mbRecording[], item) => {
                const exists = !!arr.find((x) => x.title === item.title);
                if (!exists) {
                  arr.push(item);
                }
                return arr;
              }, []);
              resolve(results);
            }
          }
        );
      });
    } catch (e) {
      logger.error('Failed to get recordings by artist', {
        label: 'MusicBrainz',
        message: e.message,
      });
      return new Promise<mbRecording[]>((resolve) => resolve([]));
    }
  };

  public getRecording = (recordingId: string): Promise<mbRecording> => {
    try {
      return new Promise<mbRecording>((resolve, reject) => {
        this.recording(
          recordingId,
          {
            inc: 'tags+artists+releases',
          },
          (error, data) => {
            if (error) {
              reject(error);
            } else {
              const results = convertRecording(data as Recording);
              resolve(results);
            }
          }
        );
      });
    } catch (e) {
      logger.error('Failed to get recording', {
        label: 'MusicBrainz',
        message: e.message,
      });
      return new Promise<mbRecording>((resolve) => resolve({} as mbRecording));
    }
  };

  public getReleaseGroups = (
    artistId: string,
    maxElements = 50,
    startOffset = 0
  ): Promise<mbReleaseGroup[]> => {
    try {
      return new Promise<mbReleaseGroup[]>((resolve, reject) => {
        this.browse(
          'release-group',
          { artist: artistId, offset: startOffset },
          async (error, data) => {
            if (error) {
              reject(error);
            } else {
              data = data as {
                'release-group-count': number;
                'release-group-offset': number;
                'release-groups': Group[];
              };
              // Get the first 25 results
              const total = data['release-group-count'];
              let results: mbReleaseGroup[] =
                data['release-groups'].map(convertReleaseGroup);

              // Slice the results into smaller chunks to avoid hitting the limit of 100

              for (
                let i = data['release-groups'].length + startOffset;
                i < total && i < maxElements;
                i += 100
              ) {
                results = results.concat(
                  await new Promise<mbReleaseGroup[]>((resolve2, reject2) => {
                    this.browse(
                      'release-group',
                      {
                        artist: artistId,
                        offset: i,
                        limit: 100,
                      },
                      (error, data) => {
                        if (error) {
                          reject2(error);
                        } else {
                          const results = (
                            (
                              data as {
                                'release-group-count': number;
                                'release-group-offset': number;
                                'release-groups': Group[];
                              }
                            )['release-groups'] ?? []
                          ).map(convertReleaseGroup);
                          resolve2(results);
                        }
                      }
                    );
                  })
                );
              }
              results = results.reduce((arr: mbReleaseGroup[], item) => {
                const exists = !!arr.find((x) => x.title === item.title);
                if (!exists) {
                  arr.push(item);
                }
                return arr;
              }, []);
              resolve(results);
            }
          }
        );
      });
    } catch (e) {
      logger.error('Failed to get release-groups by artist', {
        label: 'MusicBrainz',
        message: e.message,
      });
      return new Promise<mbReleaseGroup[]>((resolve) => resolve([]));
    }
  };

  public getReleaseGroup = (
    releaseGroupId: string
  ): Promise<mbReleaseGroup> => {
    try {
      return new Promise<mbReleaseGroup>((resolve, reject) => {
        this.releaseGroup(
          releaseGroupId,
          {
            inc: 'tags+artists+releases',
          },
          (error, data) => {
            if (error) {
              reject(error);
            } else {
              const results = convertReleaseGroup(data as Group);
              resolve(results);
            }
          }
        );
      });
    } catch (e) {
      logger.error('Failed to get release-group', {
        label: 'MusicBrainz',
        message: e.message,
      });
      return new Promise<mbReleaseGroup>((resolve) =>
        resolve({} as mbReleaseGroup)
      );
    }
  };

  public getReleases = (
    artistId: string,
    maxElements = 50,
    startOffset = 0
  ): Promise<mbRelease[]> => {
    try {
      return new Promise<mbRelease[]>((resolve, reject) => {
        this.browse(
          'release',
          { artist: artistId, offset: startOffset, inc: 'tags+release-groups' },
          async (error, data) => {
            if (error) {
              reject(error);
            } else {
              data = data as {
                'release-count': number;
                'release-offset': number;
                releases: Release[];
              };
              // Get the first 25 results
              const total = data['release-count'];
              let results: mbRelease[] = data.releases.map(convertRelease);

              // Slice the results into smaller chunks to avoid hitting the limit of 100

              for (
                let i = data.releases.length + startOffset;
                i < total && i < maxElements;
                i += 100
              ) {
                results = results.concat(
                  await new Promise<mbRelease[]>((resolve2, reject2) => {
                    this.browse(
                      'release',
                      {
                        artist: artistId,
                        offset: i,
                        limit: 100,
                        inc: 'tags+release-groups',
                      },
                      (error, data) => {
                        if (error) {
                          reject2(error);
                        } else {
                          const results = (
                            (
                              data as {
                                'release-count': number;
                                'release-offset': number;
                                releases: Release[];
                              }
                            ).releases ?? []
                          ).map(convertRelease);
                          resolve2(results);
                        }
                      }
                    );
                  })
                );
              }
              results = results.reduce((arr: mbRelease[], item) => {
                const exists = !!arr.find((x) => x.title === item.title);
                if (!exists) {
                  arr.push(item);
                }
                return arr;
              }, []);
              resolve(results);
            }
          }
        );
      });
    } catch (e) {
      logger.error('Failed to get releases by artist', {
        label: 'MusicBrainz',
        message: e.message,
      });
      return new Promise<mbRelease[]>((resolve) => resolve([]));
    }
  };

  public getRelease = (releaseId: string): Promise<mbRelease> => {
    try {
      return new Promise<mbRelease>((resolve, reject) => {
        this.release(
          releaseId,
          {
            inc: 'tags+artists+recordings',
          },
          (error, data) => {
            if (error) {
              reject(error);
            } else {
              const results = convertRelease(data as Release);
              resolve(results);
            }
          }
        );
      });
    } catch (e) {
      logger.error('Failed to get release', {
        label: 'MusicBrainz',
        message: e.message,
      });
      return new Promise<mbRelease>((resolve) => resolve({} as mbRelease));
    }
  };

  public getWorks = (
    artistId: string,
    maxElements = 50,
    startOffset = 0
  ): Promise<mbWork[]> => {
    try {
      return new Promise<mbWork[]>((resolve, reject) => {
        this.browse(
          'work',
          { artist: artistId, offset: startOffset },
          async (error, data) => {
            if (error) {
              reject(error);
            } else {
              data = data as {
                'work-count': number;
                'work-offset': number;
                works: Work[];
              };
              // Get the first 25 results
              const total = data['work-count'];
              let results: mbWork[] = data.works.map(convertWork);

              // Slice the results into smaller chunks to avoid hitting the limit of 100

              for (
                let i = data.works.length + startOffset;
                i < total && i < maxElements;
                i += 100
              ) {
                results = results.concat(
                  await new Promise<mbWork[]>((resolve2, reject2) => {
                    this.browse(
                      'work',
                      {
                        artist: artistId,
                        offset: i,
                        limit: 100,
                      },
                      (error, data) => {
                        if (error) {
                          reject2(error);
                        } else {
                          const results = (
                            (
                              data as {
                                'work-count': number;
                                'work-offset': number;
                                works: Work[];
                              }
                            ).works ?? []
                          ).map(convertWork);
                          resolve2(results);
                        }
                      }
                    );
                  })
                );
              }
              results = results.reduce((arr: mbWork[], item) => {
                const exists = !!arr.find((x) => x.title === item.title);
                if (!exists) {
                  arr.push(item);
                }
                return arr;
              }, []);
              resolve(results);
            }
          }
        );
      });
    } catch (e) {
      logger.error('Failed to get works by artist', {
        label: 'MusicBrainz',
        message: e.message,
      });
      return new Promise<mbWork[]>((resolve) => resolve([]));
    }
  };

  public getWork = (workId: string): Promise<mbWork> => {
    try {
      return new Promise<mbWork>((resolve, reject) => {
        this.work(
          workId,
          {
            inc: 'tags+artist-rels',
          },
          (error, data) => {
            if (error) {
              reject(error);
            } else {
              const results = convertWork(data as Work);
              resolve(results);
            }
          }
        );
      });
    } catch (e) {
      logger.error('Failed to get work', {
        label: 'MusicBrainz',
        message: e.message,
      });
      return new Promise<mbWork>((resolve) => resolve({} as mbWork));
    }
  };
}

export default MusicBrainz;
export type {
  SearchOptions,
  ArtistSearchOptions,
  RecordingSearchOptions,
  ReleaseSearchOptions,
  ReleaseGroupSearchOptions,
  WorkSearchOptions,
};