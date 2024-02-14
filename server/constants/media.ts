export enum MediaRequestStatus {
  PENDING = 1,
  APPROVED,
  DECLINED,
  FAILED,
}

export enum MediaType {
  MOVIE = 'movie',
  TV = 'tv',
  MUSIC = 'music',
}

export enum SecondaryType {
  ARTIST = 'artist',
  RELEASE_GROUP = 'release-group',
  RELEASE = 'release',
  RECORDING = 'recording',
  WORK = 'work',
}

export enum MediaStatus {
  UNKNOWN = 1,
  PENDING,
  PROCESSING,
  PARTIALLY_AVAILABLE,
  AVAILABLE,
}
