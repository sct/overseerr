// Purpose: Interfaces for MusicBrainz data.

export interface mbDefaultType {
  media_type: string;
  id: string;
  tags: string[];
}

export enum mbArtistType {
  PERSON = 'Person',
  GROUP = 'Group',
  ORCHESTRA = 'Orchestra',
  CHOIR = 'Choir',
  CHARACTER = 'Character',
  OTHER = 'Other',
}

export interface mbArtist extends mbDefaultType {
  media_type: 'artist';
  name: string;
  sortName: string;
  type: mbArtistType;
  recordings?: mbRecording[];
  releases?: mbRelease[];
  releaseGroups?: mbReleaseGroup[];
  works?: mbWork[];
  gender?: string;
  area?: string;
  beginDate?: string;
  endDate?: string;
}

export interface mbRecording extends mbDefaultType {
  media_type: 'recording';
  title: string;
  artist: mbArtist[];
  length: number;
  firstReleased?: Date;
}

export interface mbRelease extends mbDefaultType {
  media_type: 'release';
  title: string;
  artist: mbArtist[];
  date?: Date;
  tracks?: mbRecording[];
  releaseGroup?: mbReleaseGroup;
}

export enum mbReleaseGroupType {
  ALBUM = 'Album',
  SINGLE = 'Single',
  EP = 'EP',
  BROADCAST = 'Broadcast',
  OTHER = 'Other',
}

export interface mbReleaseGroup extends mbDefaultType {
  media_type: 'release-group';
  title: string;
  artist: mbArtist[];
  type: mbReleaseGroupType;
  firstReleased?: Date;
  releases?: mbRelease[];
}

export enum mbWorkType {
  ARIA = 'Aria',
  BALLET = 'Ballet',
  CANTATA = 'Cantata',
  CONCERTO = 'Concerto',
  SONATA = 'Sonata',
  SUITE = 'Suite',
  MADRIGAL = 'Madrigal',
  MASS = 'Mass',
  MOTET = 'Motet',
  OPERA = 'Opera',
  ORATORIO = 'Oratorio',
  OVERTURE = 'Overture',
  PARTITA = 'Partita',
  QUARTET = 'Quartet',
  SONG_CYCLE = 'Song-cycle',
  SYMPHONY = 'Symphony',
  SONG = 'Song',
  SYMPHONIC_POEM = 'Symphonic poem',
  ZARZUELA = 'Zarzuela',
  ETUDE = 'Étude',
  POEM = 'Poem',
  SOUNDTRACK = 'Soundtrack',
  PROSE = 'Prose',
  OPERETTA = 'Operetta',
  AUDIO_DRAMA = 'Audio drama',
  BEIJING_OPERA = 'Beijing opera',
  PLAY = 'Play',
  MUSICAL = 'Musical',
  INCIDENTAL_MUSIC = 'Incidental music',
  OTHER = 'Other',
}

export interface mbWork extends mbDefaultType {
  media_type: 'work';
  title: string;
  type: mbWorkType;
  artist: mbArtist[];
}

export interface Artist {
  'end-area': Area;
  tags: Tag[];
  name: string;
  country: string;
  ipis: string[];
  gender: string;
  area: Area;
  begin_area: Area;
  id: string;
  releases: Release[];
  'type-id': string;
  'begin-area': Area;
  isnis: string[];
  recordings: Recording[];
  'sort-name': string;
  'release-groups': Group[];
  works: Work[];
  type: string;
  'gender-id': string;
  disambiguation: string;
  end_area: Area;
  'life-span': LifeSpan;
}

export interface Tag {
  count: number;
  name: string;
}

export interface Area {
  type: string;
  disambiguation: string;
  'iso-3166-1-codes'?: string[];
  'type-id': string;
  id: string;
  'sort-name': string;
  name: string;
}

export interface Release {
  'packaging-id'?: string;
  title: string;
  'release-events'?: Event[];
  tags: Tag[];
  country?: string;
  status: string;
  'release-group': Group;
  quality: string;
  media: Medium[];
  date?: string;
  packaging?: string;
  disambiguation: string;
  barcode?: string;
  'status-id': string;
  'text-representation': TextRepresentation;
  id: string;
  'cover-art-archive': CoverArtArchive;
  'artist-credit': ArtistCredit[];
}

export interface CoverArtArchive {
  artwork: boolean;
  back: boolean;
  count: number;
  darkened: boolean;
  front: boolean;
}

export interface ArtistCredit {
  name: string;
  joinphrase: string;
  artist: Artist;
}

export interface Event {
  area?: Area;
  date: string;
}

export interface Medium {
  position: number;
  'format-id': string;
  format: string;
  title: string;
  'track-count': number;
  'track-offset'?: number;
  tracks?: Track[];
}

export interface Track {
  title: string;
  position: number;
  number: string;
  recording: Recording;
  length: number;
  id: string;
}

export interface TextRepresentation {
  language: string;
  script: string;
}

export interface Recording {
  title: string;
  tags: Tag[];
  disambiguation: string;
  id: string;
  releases: Release[];
  'first-release-date': string;
  length: number;
  'artist-credit': ArtistCredit[];
  video: boolean;
}

export interface Group {
  id: string;
  releases: Release[];
  'first-release-date': string;
  'primary-type': string;
  tags: Tag[];
  'secondary-types': string[];
  disambiguation: string;
  'secondary-type-ids': string[];
  'primary-type-id': string;
  title: string;
  'artist-credit': ArtistCredit[];
}

export interface Work {
  attributes: Attribute[];
  language: string;
  type: string;
  disambiguation: string;
  id: string;
  'type-id': string;
  iswcs: string[];
  title: string;
  tags: Tag[];
  languages: string[];
  relations: Relation[];
}

export interface Relation {
  type: string;
  attributes: Attribute[];
  begin: string;
  'target-credit': string;
  end: string;
  'type-id': string;
  direction: string;
  ended: boolean;
  'target-type': string;
  'source-credit': string;
  artist: Artist;
}

export interface Attribute {
  'type-id': string;
  type: string;
  value: string;
}

export interface LifeSpan {
  ended: boolean;
  end: string;
  begin: string;
}

export interface SearchOptions {
  query: string;
  page?: number;
  limit?: number;
  keywords?: string;
  artistname?: string;
  albumname?: string;
  recordingname?: string;
  tags?: string[];
  tag?: string;
}
