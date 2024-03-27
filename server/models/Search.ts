import type {
  mbArtist,
  mbArtistType,
  mbRecording,
  mbRelease,
  mbReleaseGroup,
  mbReleaseGroupType,
  mbWork,
} from '@server/api/musicbrainz/interfaces';
import getPosterFromMB, {
  cachedFanartFromMB,
} from '@server/api/musicbrainz/poster';
import type {
  TmdbCollectionResult,
  TmdbMovieDetails,
  TmdbMovieResult,
  TmdbPersonDetails,
  TmdbPersonResult,
  TmdbTvDetails,
  TmdbTvResult,
} from '@server/api/themoviedb/interfaces';
import type Media from '@server/entity/Media';

export type MediaType =
  | 'tv'
  | 'movie'
  | 'music'
  | 'person'
  | 'collection'
  | 'release-group'
  | 'release'
  | 'recording'
  | 'work'
  | 'artist';

interface SearchResult {
  id: number;
  mediaType: MediaType;
  popularity: number;
  posterPath?: string;
  backdropPath?: string;
  voteCount: number;
  voteAverage: number;
  genreIds: number[];
  overview: string;
  originalLanguage: string;
  mediaInfo?: Media;
}

export interface MovieResult extends SearchResult {
  mediaType: 'movie';
  title: string;
  originalTitle: string;
  releaseDate: string;
  adult: boolean;
  video: boolean;
  mediaInfo?: Media;
}

export interface TvResult extends SearchResult {
  mediaType: 'tv';
  name: string;
  originalName: string;
  originCountry: string[];
  firstAirDate: string;
}

export interface MusicResult extends SearchResult {
  mediaType: 'music';
  title: string;
  originalTitle: string;
  releaseDate: string;
  mediaInfo?: Media;
}

export interface CollectionResult {
  id: number;
  mediaType: 'collection';
  title: string;
  originalTitle: string;
  adult: boolean;
  posterPath?: string;
  backdropPath?: string;
  overview: string;
  originalLanguage: string;
  mediaInfo?: Media;
}

export interface PersonResult {
  id: number;
  name: string;
  popularity: number;
  profilePath?: string;
  adult: boolean;
  mediaType: 'person';
  knownFor: (MovieResult | TvResult)[];
  mediaInfo?: Media;
}

export interface ReleaseGroupResult {
  id: string;
  mediaType: 'release-group';
  type: mbReleaseGroupType;
  posterPath?: string;
  title: string;
  releases: ReleaseResult[];
  artist: ArtistResult[];
  tags: string[];
  mediaInfo?: Media;
}

export interface ReleaseResult {
  id: string;
  mediaType: 'release';
  title: string;
  artist: ArtistResult[];
  posterPath?: string;
  date?: Date | string;
  tracks?: RecordingResult[];
  tags: string[];
  mediaInfo?: Media;
  releaseGroup?: ReleaseGroupResult;
}

export interface RecordingResult {
  id: string;
  mediaType: 'recording';
  title: string;
  artist: ArtistResult[];
  length: number;
  firstReleased?: Date;
  tags: string[];
  mediaInfo?: Media;
}

export interface WorkResult {
  id: string;
  mediaType: 'work';
  title: string;
  artist: ArtistResult[];
  tags: string[];
  mediaInfo?: Media;
}

export interface ArtistResult {
  id: string;
  mediaType: 'artist';
  name: string;
  type: mbArtistType;
  releases: ReleaseResult[];
  gender?: string;
  area?: string;
  beginDate?: string;
  endDate?: string;
  tags: string[];
  mediaInfo?: Media;
  posterPath?: string;
  fanartPath?: string;
}

export type Results =
  | MovieResult
  | TvResult
  | MusicResult
  | PersonResult
  | CollectionResult
  | ReleaseGroupResult
  | ReleaseResult
  | RecordingResult
  | WorkResult
  | ArtistResult;

export type MbSearchMultiResponse = {
  page: number;
  total_pages: number;
  total_results: number;
  results: (mbRelease | mbArtist)[];
};

export type MixedSearchResponse = {
  page: number;
  total_pages: number;
  total_results: number;
  results: (
    | mbArtist
    | mbRelease
    | TmdbMovieResult
    | TmdbTvResult
    | TmdbPersonResult
    | TmdbCollectionResult
  )[];
};

export const mapMovieResult = async (
  movieResult: TmdbMovieResult,
  media?: Media
): Promise<MovieResult> => ({
  id: movieResult.id,
  mediaType: 'movie',
  adult: movieResult.adult,
  genreIds: movieResult.genre_ids,
  originalLanguage: movieResult.original_language,
  originalTitle: movieResult.original_title,
  overview: movieResult.overview,
  popularity: movieResult.popularity,
  releaseDate: movieResult.release_date,
  title: movieResult.title,
  video: movieResult.video,
  voteAverage: movieResult.vote_average,
  voteCount: movieResult.vote_count,
  backdropPath: movieResult.backdrop_path,
  posterPath: movieResult.poster_path,
  mediaInfo: media,
});

export const mapTvResult = async (
  tvResult: TmdbTvResult,
  media?: Media
): Promise<TvResult> => ({
  id: tvResult.id,
  firstAirDate: tvResult.first_air_date,
  genreIds: tvResult.genre_ids,
  // Some results from tmdb dont return the mediaType so we force it here!
  mediaType: tvResult.media_type || 'tv',
  name: tvResult.name,
  originCountry: tvResult.origin_country,
  originalLanguage: tvResult.original_language,
  originalName: tvResult.original_name,
  overview: tvResult.overview,
  popularity: tvResult.popularity,
  voteAverage: tvResult.vote_average,
  voteCount: tvResult.vote_count,
  backdropPath: tvResult.backdrop_path,
  posterPath: tvResult.poster_path,
  mediaInfo: media,
});

export const mapCollectionResult = async (
  collectionResult: TmdbCollectionResult,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _media?: Media
): Promise<CollectionResult> => ({
  id: collectionResult.id,
  mediaType: collectionResult.media_type || 'collection',
  adult: collectionResult.adult,
  originalLanguage: collectionResult.original_language,
  originalTitle: collectionResult.original_title,
  title: collectionResult.title,
  overview: collectionResult.overview,
  backdropPath: collectionResult.backdrop_path,
  posterPath: collectionResult.poster_path,
});

export const mapPersonResult = async (
  personResult: TmdbPersonResult,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _media?: Media
): Promise<PersonResult> => ({
  id: personResult.id,
  name: personResult.name,
  popularity: personResult.popularity,
  adult: personResult.adult,
  mediaType: personResult.media_type,
  profilePath: personResult.profile_path,
  knownFor: await Promise.all(
    personResult.known_for.map((result) => {
      if (result.media_type === 'movie') {
        return mapMovieResult(result);
      }

      return mapTvResult(result);
    })
  ),
});

export const mapReleaseGroupResult = async (
  releaseGroupResult: mbReleaseGroup,
  media?: Media
): Promise<ReleaseGroupResult> => {
  return {
    id: releaseGroupResult.id,
    mediaType: releaseGroupResult.media_type,
    type: releaseGroupResult.type,
    title: releaseGroupResult.title,
    artist: await Promise.all(
      releaseGroupResult.artist.map((artist) => mapArtistResult(artist))
    ),
    releases: await Promise.all(
      (releaseGroupResult.releases ?? []).map((release) =>
        mapReleaseResult(release)
      )
    ),
    tags: releaseGroupResult.tags,
    posterPath: await getPosterFromMB(releaseGroupResult),
    mediaInfo: media ?? undefined,
  };
};

export const mapArtistResult = async (
  artist: mbArtist,
  media?: Media
): Promise<ArtistResult> => ({
  id: artist.id,
  mediaType: 'artist',
  name: artist.name,
  type: artist.type,
  releases: await Promise.all(
    Array.isArray(artist.releases)
      ? artist.releases.map((release) => mapReleaseResult(release))
      : []
  ),
  tags: artist.tags,
  mediaInfo: media ?? undefined,
  posterPath: await getPosterFromMB(artist),
  fanartPath: await cachedFanartFromMB(artist),
});

export const mapReleaseResult = async (
  release: mbRelease,
  media?: Media
): Promise<ReleaseResult> => ({
  id: release.id,
  mediaType: release.media_type,
  title: release.title,
  posterPath: await getPosterFromMB(release),
  artist: await Promise.all(
    release.artist.map((artist) => mapArtistResult(artist))
  ),
  date: release.date,
  tracks: await Promise.all(
    Array.isArray(release.tracks)
      ? release.tracks.map((track) => mapRecordingResult(track))
      : []
  ),
  tags: release.tags,
  releaseGroup: release.releaseGroup
    ? await mapReleaseGroupResult(release.releaseGroup)
    : undefined,
  mediaInfo: media,
});

export const mapRecordingResult = async (
  recording: mbRecording,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _media?: Media
): Promise<RecordingResult> => ({
  id: recording.id,
  mediaType: recording.media_type,
  title: recording.title,
  artist: await Promise.all(
    recording.artist.map((artist) => mapArtistResult(artist))
  ),
  length: recording.length,
  firstReleased: recording.firstReleased,
  tags: recording.tags,
});

export const mapWorkResult = async (
  work: mbWork,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _media?: Media
): Promise<WorkResult> => ({
  id: work.id,
  mediaType: work.media_type,
  title: work.title,
  artist: await Promise.all(
    work.artist.map((artist) => mapArtistResult(artist))
  ),
  tags: work.tags,
});

export const mapSearchResults = (
  results: (
    | TmdbMovieResult
    | TmdbTvResult
    | TmdbPersonResult
    | TmdbCollectionResult
    | mbArtist
    | mbRecording
    | mbRelease
    | mbReleaseGroup
    | mbWork
  )[],
  media?: Media[]
): Promise<Results[]> => {
  const mediaLookup = new Map();
  if (media) {
    media.forEach((item) => {
      mediaLookup.set(item.tmdbId || item.mbId, item);
    });
  }

  const mapFunctions = {
    movie: mapMovieResult,
    tv: mapTvResult,
    collection: mapCollectionResult,
    person: mapPersonResult,
    'release-group': mapReleaseGroupResult,
    release: mapReleaseResult,
    recording: mapRecordingResult,
    work: mapWorkResult,
    artist: mapArtistResult,
  };

  const transformResults = (
    result:
      | TmdbMovieResult
      | TmdbTvResult
      | TmdbPersonResult
      | TmdbCollectionResult
      | mbArtist
      | mbRecording
      | mbRelease
      | mbReleaseGroup
      | mbWork
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapFunction: (result: any, media?: Media) => Promise<any> =
      mapFunctions[result.media_type];
    if (mapFunction) {
      const mediaItem = mediaLookup.get(result.id);
      return mapFunction(result, mediaItem);
    }
  };

  const out = Promise.all(
    results.map((result) => transformResults(result)).filter((result) => result)
  );

  return out;
};
export const mapMovieDetailsToResult = (
  movieDetails: TmdbMovieDetails
): TmdbMovieResult => ({
  id: movieDetails.id,
  media_type: 'movie',
  adult: movieDetails.adult,
  genre_ids: movieDetails.genres.map((genre) => genre.id),
  original_language: movieDetails.original_language,
  original_title: movieDetails.original_title,
  overview: movieDetails.overview ?? '',
  popularity: movieDetails.popularity,
  release_date: movieDetails.release_date,
  title: movieDetails.title,
  video: movieDetails.video,
  vote_average: movieDetails.vote_average,
  vote_count: movieDetails.vote_count,
  backdrop_path: movieDetails.backdrop_path,
  poster_path: movieDetails.poster_path,
});

export const mapTvDetailsToResult = (
  tvDetails: TmdbTvDetails
): TmdbTvResult => ({
  id: tvDetails.id,
  media_type: 'tv',
  first_air_date: tvDetails.first_air_date,
  genre_ids: tvDetails.genres.map((genre) => genre.id),
  name: tvDetails.name,
  origin_country: tvDetails.origin_country,
  original_language: tvDetails.original_language,
  original_name: tvDetails.original_name,
  overview: tvDetails.overview,
  popularity: tvDetails.popularity,
  vote_average: tvDetails.vote_average,
  vote_count: tvDetails.vote_count,
  backdrop_path: tvDetails.backdrop_path,
  poster_path: tvDetails.poster_path,
});

export const mapPersonDetailsToResult = (
  personDetails: TmdbPersonDetails
): TmdbPersonResult => ({
  id: personDetails.id,
  media_type: 'person',
  name: personDetails.name,
  popularity: personDetails.popularity,
  adult: personDetails.adult,
  profile_path: personDetails.profile_path,
  known_for: [],
});
