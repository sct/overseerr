import fs from 'fs';
import path from 'path';
import { merge } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

export interface Library {
  id: string;
  name: string;
  enabled: boolean;
}

export interface PlexSettings {
  name: string;
  machineId?: string;
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
  activeProfileId: number;
  activeProfileName: string;
  activeDirectory: string;
  is4k: boolean;
  isDefault: boolean;
}

export interface RadarrSettings extends DVRSettings {
  minimumAvailability: string;
}

export interface SonarrSettings extends DVRSettings {
  activeAnimeProfileId?: number;
  activeAnimeProfileName?: string;
  activeAnimeDirectory?: string;
  enableSeasonFolders: boolean;
}

export interface MainSettings {
  apiKey: string;
  applicationUrl: string;
}

interface PublicSettings {
  initialized: boolean;
}

interface NotificationAgent {
  enabled: boolean;
  types: number;
  options: Record<string, unknown>;
}
interface NotificationAgentDiscord extends NotificationAgent {
  options: {
    webhookUrl: string;
  };
}

interface NotificationAgentEmail extends NotificationAgent {
  options: {
    emailFrom: string;
    smtpHost: string;
    smtpPort: number;
    secure: boolean;
    authUser?: string;
    authPass?: string;
  };
}

interface NotificationAgents {
  email: NotificationAgentEmail;
  discord: NotificationAgentDiscord;
}

interface NotificationSettings {
  agents: NotificationAgents;
}

interface AllSettings {
  clientId: string;
  main: MainSettings;
  plex: PlexSettings;
  radarr: RadarrSettings[];
  sonarr: SonarrSettings[];
  public: PublicSettings;
  notifications: NotificationSettings;
}

const SETTINGS_PATH = path.join(__dirname, '../../config/settings.json');

class Settings {
  private data: AllSettings;

  constructor(initialSettings?: AllSettings) {
    this.data = {
      clientId: uuidv4(),
      main: {
        apiKey: '',
        applicationUrl: '',
      },
      plex: {
        name: '',
        ip: '127.0.0.1',
        port: 32400,
        libraries: [],
      },
      radarr: [],
      sonarr: [],
      public: {
        initialized: false,
      },
      notifications: {
        agents: {
          email: {
            enabled: false,
            types: 0,
            options: {
              emailFrom: '',
              smtpHost: '127.0.0.1',
              smtpPort: 465,
              secure: false,
            },
          },
          discord: {
            enabled: false,
            types: 0,
            options: {
              webhookUrl: '',
            },
          },
        },
      },
    };
    if (initialSettings) {
      this.data = merge(this.data, initialSettings);
    }
  }

  get main(): MainSettings {
    if (!this.data.main.apiKey) {
      this.data.main.apiKey = this.generateApiKey();
      this.save();
    }
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

  get notifications(): NotificationSettings {
    return this.data.notifications;
  }

  set notifications(data: NotificationSettings) {
    this.data.notifications = data;
  }

  get clientId(): string {
    if (!this.data.clientId) {
      this.data.clientId = uuidv4();
      this.save();
    }

    return this.data.clientId;
  }

  public regenerateApiKey(): MainSettings {
    this.main.apiKey = this.generateApiKey();
    this.save();
    return this.main;
  }

  private generateApiKey(): string {
    return Buffer.from(`${Date.now()}${this.clientId}`).toString('base64');
  }

  /**
   * Settings Load
   *
   * This will load settings from file unless an optional argument of the object structure
   * is passed in.
   * @param overrideSettings If passed in, will override all existing settings with these
   * values
   */
  public load(overrideSettings?: AllSettings): Settings {
    if (overrideSettings) {
      this.data = overrideSettings;
      return this;
    }

    if (!fs.existsSync(SETTINGS_PATH)) {
      this.save();
    }
    const data = fs.readFileSync(SETTINGS_PATH, 'utf-8');

    if (data) {
      this.data = merge(this.data, JSON.parse(data));
      this.save();
    }
    return this;
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
