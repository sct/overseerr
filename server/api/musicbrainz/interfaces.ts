// Purpose: Interfaces for MusicBrainz data.

export enum mbArtistType {
  PERSON = 'Person',
  GROUP = 'Group',
  ORCHESTRA = 'Orchestra',
  CHOIR = 'Choir',
  CHARACTER = 'Character',
  OTHER = 'Other',
};

export interface mbArtist {
  id: string;
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
  tags: string[];
};

export interface mbRecording {
  id: string;
  title: string;
  artist: mbArtist[];
  length: number;
  firstReleased?: Date;
  tags: string[];
};

export interface mbRelease {
  id: string;
  title: string;
  artist: mbArtist[];
  date?: Date;
  tracks?: mbRecording[];
  tags: string[];
};


export enum mbReleaseGroupType {
  ALBUM = 'Album',
  SINGLE = 'Single',
  EP = 'EP',
  BROADCAST = 'Broadcast',
  OTHER = 'Other',
};

export interface mbReleaseGroup {
  id: string;
  title: string;
  artist: mbArtist[];
  type: mbReleaseGroupType;
  firstReleased?: Date;
  releases?: mbRelease[];
  tags: string[];
};

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
};


export interface mbWork {
  id: string;
  title: string;
  type: mbWorkType;
  artist: mbArtist[];
  tags: string[];
};
