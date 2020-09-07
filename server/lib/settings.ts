import fs from 'fs';
import path from 'path';

interface Library {
  id: string;
  name: string;
  enabled: boolean;
}

interface PlexSettings {
  name: string;
  machineId: string;
  ip: string;
  port: number;
  libraries: Library[];
}

interface DVRSettings {
  id: number;
  name: string;
  hostname: string;
  port: number;
  apiKey: string;
  useSsl: boolean;
  baseUrl?: string;
  activeProfile: string;
  activeDirectory: string;
  is4k: boolean;
}

export interface RadarrSettings extends DVRSettings {
  minimumAvailability: string;
}

export interface SonarrSettings extends DVRSettings {
  activeAnimeProfile?: string;
  activeAnimeDirectory?: string;
  enableSeasonFolders: boolean;
}

interface MainSettings {
  apiKey: string;
}

interface PublicSettings {
  initialized: boolean;
}

interface AllSettings {
  main: MainSettings;
  plex: PlexSettings;
  radarr: RadarrSettings[];
  sonarr: SonarrSettings[];
  public: PublicSettings;
}

const SETTINGS_PATH = path.join(__dirname, '../../config/settings.json');

class Settings {
  private data: AllSettings;

  constructor(initialSettings?: AllSettings) {
    this.data = {
      main: {
        apiKey: 'temp',
      },
      plex: {
        name: 'Main Server',
        ip: '127.0.0.1',
        port: 32400,
        machineId: '',
        libraries: [],
      },
      radarr: [],
      sonarr: [],
      public: {
        initialized: false,
      },
    };
    if (initialSettings) {
      Object.assign<AllSettings, AllSettings>(this.data, initialSettings);
    }
  }

  get main(): MainSettings {
    return this.data.main;
  }

  set main(data: MainSettings) {
    this.data.main = data;
  }

  get plex(): PlexSettings {
    return this.data.plex;
  }

  set plex(data: PlexSettings) {
    this.data.plex = data;
  }

  get radarr(): RadarrSettings[] {
    return this.data.radarr;
  }

  set radarr(data: RadarrSettings[]) {
    this.data.radarr = data;
  }

  get sonarr(): SonarrSettings[] {
    return this.data.sonarr;
  }

  set sonarr(data: SonarrSettings[]) {
    this.data.sonarr = data;
  }

  get public(): PublicSettings {
    return this.data.public;
  }

  set public(data: PublicSettings) {
    this.data.public = data;
  }

  /**
   * Settings Load
   *
   * This will load settings from file unless an optional argument of the object structure
   * is passed in.
   * @param overrideSettings If passed in, will override all existing settings with these
   * values
   */
  public load(overrideSettings?: AllSettings): AllSettings {
    if (overrideSettings) {
      this.data = overrideSettings;
      return this.data;
    }

    if (!fs.existsSync(SETTINGS_PATH)) {
      this.save();
    }
    const data = fs.readFileSync(SETTINGS_PATH, 'utf-8');

    if (data) {
      this.data = Object.assign(this.data, JSON.parse(data));
    }
    return this.data;
  }

  public save(): void {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(this.data, undefined, ' '));
  }
}

let settings: Settings | undefined;

export const getSettings = (initialSettings?: AllSettings): Settings => {
  if (!settings) {
    settings = new Settings(initialSettings);
  }

  return settings;
};

export default Settings;
