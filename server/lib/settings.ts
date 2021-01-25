import fs from 'fs';
import path from 'path';
import { merge } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { Permission } from './permissions';

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
  useSsl?: boolean;
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
  csrfProtection: boolean;
  defaultPermissions: number;
  hideAvailable: boolean;
}

interface PublicSettings {
  initialized: boolean;
}

interface FullPublicSettings extends PublicSettings {
  movie4kEnabled: boolean;
  series4kEnabled: boolean;
  hideAvailable: boolean;
}

export interface NotificationAgentConfig {
  enabled: boolean;
  types: number;
  options: Record<string, unknown>;
}
export interface NotificationAgentDiscord extends NotificationAgentConfig {
  options: {
    webhookUrl: string;
  };
}

export interface NotificationAgentSlack extends NotificationAgentConfig {
  options: {
    webhookUrl: string;
  };
}

export interface NotificationAgentEmail extends NotificationAgentConfig {
  options: {
    emailFrom: string;
    smtpHost: string;
    smtpPort: number;
    secure: boolean;
    authUser?: string;
    authPass?: string;
    allowSelfSigned: boolean;
    senderName: string;
  };
}

export interface NotificationAgentTelegram extends NotificationAgentConfig {
  options: {
    botAPI: string;
    chatId: string;
  };
}

export interface NotificationAgentPushover extends NotificationAgentConfig {
  options: {
    accessToken: string;
    userToken: string;
    priority: number;
    sound: string;
  };
}

export interface NotificationAgentWebhook extends NotificationAgentConfig {
  options: {
    webhookUrl: string;
    jsonPayload: string;
    authHeader: string;
  };
}

interface NotificationAgents {
  email: NotificationAgentEmail;
  discord: NotificationAgentDiscord;
  slack: NotificationAgentSlack;
  telegram: NotificationAgentTelegram;
  pushover: NotificationAgentPushover;
  webhook: NotificationAgentWebhook;
}

interface NotificationSettings {
  enabled: boolean;
  autoapprovalEnabled: boolean;
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

const SETTINGS_PATH = process.env.CONFIG_DIRECTORY
  ? `${process.env.CONFIG_DIRECTORY}/settings.json`
  : path.join(__dirname, '../../config/settings.json');

class Settings {
  private data: AllSettings;

  constructor(initialSettings?: AllSettings) {
    this.data = {
      clientId: uuidv4(),
      main: {
        apiKey: '',
        applicationUrl: '',
        hideAvailable: false,
        csrfProtection: false,
        defaultPermissions: Permission.REQUEST,
      },
      plex: {
        name: '',
        ip: '127.0.0.1',
        port: 32400,
        useSsl: false,
        libraries: [],
      },
      radarr: [],
      sonarr: [],
      public: {
        initialized: false,
      },
      notifications: {
        enabled: true,
        autoapprovalEnabled: false,
        agents: {
          email: {
            enabled: false,
            types: 0,
            options: {
              emailFrom: '',
              smtpHost: '127.0.0.1',
              smtpPort: 587,
              secure: false,
              allowSelfSigned: false,
              senderName: 'Overseerr',
            },
          },
          discord: {
            enabled: false,
            types: 0,
            options: {
              webhookUrl: '',
            },
          },
          slack: {
            enabled: false,
            types: 0,
            options: {
              webhookUrl: '',
            },
          },
          telegram: {
            enabled: false,
            types: 0,
            options: {
              botAPI: '',
              chatId: '',
            },
          },
          pushover: {
            enabled: false,
            types: 0,
            options: {
              accessToken: '',
              userToken: '',
              priority: 0,
              sound: '',
            },
          },
          webhook: {
            enabled: false,
            types: 0,
            options: {
              webhookUrl: '',
              authHeader: '',
              jsonPayload:
                'IntcbiAgICBcIm5vdGlmaWNhdGlvbl90eXBlXCI6IFwie3tub3RpZmljYXRpb25fdHlwZX19XCIsXG4gICAgXCJzdWJqZWN0XCI6IFwie3tzdWJqZWN0fX1cIixcbiAgICBcIm1lc3NhZ2VcIjogXCJ7e21lc3NhZ2V9fVwiLFxuICAgIFwiaW1hZ2VcIjogXCJ7e2ltYWdlfX1cIixcbiAgICBcImVtYWlsXCI6IFwie3tub3RpZnl1c2VyX2VtYWlsfX1cIixcbiAgICBcInVzZXJuYW1lXCI6IFwie3tub3RpZnl1c2VyX3VzZXJuYW1lfX1cIixcbiAgICBcImF2YXRhclwiOiBcInt7bm90aWZ5dXNlcl9hdmF0YXJ9fVwiLFxuICAgIFwie3ttZWRpYX19XCI6IHtcbiAgICAgICAgXCJtZWRpYV90eXBlXCI6IFwie3ttZWRpYV90eXBlfX1cIixcbiAgICAgICAgXCJ0bWRiSWRcIjogXCJ7e21lZGlhX3RtZGJpZH19XCIsXG4gICAgICAgIFwiaW1kYklkXCI6IFwie3ttZWRpYV9pbWRiaWR9fVwiLFxuICAgICAgICBcInR2ZGJJZFwiOiBcInt7bWVkaWFfdHZkYmlkfX1cIixcbiAgICAgICAgXCJzdGF0dXNcIjogXCJ7e21lZGlhX3N0YXR1c319XCIsXG4gICAgICAgIFwic3RhdHVzNGtcIjogXCJ7e21lZGlhX3N0YXR1czRrfX1cIlxuICAgIH0sXG4gICAgXCJ7e2V4dHJhfX1cIjogW11cbn0i',
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

  get fullPublicSettings(): FullPublicSettings {
    return {
      ...this.data.public,
      movie4kEnabled: this.data.radarr.some(
        (radarr) => radarr.is4k && radarr.isDefault
      ),
      series4kEnabled: this.data.sonarr.some(
        (sonarr) => sonarr.is4k && sonarr.isDefault
      ),
      hideAvailable: this.data.main.hideAvailable,
    };
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
    return Buffer.from(`${Date.now()}${uuidv4()})`).toString('base64');
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
