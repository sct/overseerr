import axios from 'axios';
import { Notification } from '..';
import logger from '../../../logger';
import { getSettings } from '../../settings';
import type { NotificationAgent, NotificationPayload } from './agent';

enum EmbedColors {
  DEFAULT = 0,
  AQUA = 1752220,
  GREEN = 3066993,
  BLUE = 3447003,
  PURPLE = 10181046,
  GOLD = 15844367,
  ORANGE = 15105570,
  RED = 15158332,
  GREY = 9807270,
  DARKER_GREY = 8359053,
  NAVY = 3426654,
  DARK_AQUA = 1146986,
  DARK_GREEN = 2067276,
  DARK_BLUE = 2123412,
  DARK_PURPLE = 7419530,
  DARK_GOLD = 12745742,
  DARK_ORANGE = 11027200,
  DARK_RED = 10038562,
  DARK_GREY = 9936031,
  LIGHT_GREY = 12370112,
  DARK_NAVY = 2899536,
  LUMINOUS_VIVID_PINK = 16580705,
  DARK_VIVID_PINK = 12320855,
}

interface DiscordImageEmbed {
  url?: string;
  proxy_url?: string;
  height?: number;
  width?: number;
}

interface DiscordRichEmbed {
  title?: string;
  type?: 'rich'; // Always rich for webhooks
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number;
  footer?: {
    text: string;
    icon_url?: string;
    proxy_icon_url?: string;
  };
  image?: DiscordImageEmbed;
  thumbnail?: DiscordImageEmbed;
  provider?: {
    name?: string;
    url?: string;
  };
  author?: {
    name?: string;
    url?: string;
    icon_url?: string;
    proxy_icon_url?: string;
  };
  fields?: {
    name: string;
    value: string;
    inline?: boolean;
  }[];
}

interface DiscordWebhookPayload {
  embeds: DiscordRichEmbed[];
  username: string;
  avatar_url?: string;
  tts: boolean;
}

class DiscordAgent implements NotificationAgent {
  public buildEmbed(
    type: Notification,
    payload: NotificationPayload
  ): DiscordRichEmbed {
    let color = EmbedColors.DEFAULT;

    switch (type) {
      case Notification.MEDIA_ADDED:
        color = EmbedColors.ORANGE;
    }

    return {
      title: payload.subject,
      description: payload.message,
      color,
      timestamp: new Date().toISOString(),
      author: { name: 'Overseerr' },
      fields: [
        {
          name: 'Requested By',
          value: payload.username ?? '',
          inline: true,
        },
        {
          name: 'Status',
          value: 'Pending Approval',
          inline: true,
        },
      ],
      thumbnail: {
        url: payload.image,
      },
    };
  }

  public shouldSend(type: Notification): boolean {
    const settings = getSettings();

    if (
      settings.notifications.agents.discord?.enabled &&
      settings.notifications.agents.discord?.options?.webhookUrl
    ) {
      return true;
    }

    return false;
  }

  public async send(
    type: Notification,
    payload: NotificationPayload
  ): Promise<boolean> {
    const settings = getSettings();
    logger.debug('Sending discord notification', { label: 'Notifications' });
    try {
      const webhookUrl = settings.notifications.agents.discord?.options
        ?.webhookUrl as string;

      if (!webhookUrl) {
        return false;
      }

      await axios.post(webhookUrl, {
        username: 'Overseerr',
        embeds: [this.buildEmbed(type, payload)],
      } as DiscordWebhookPayload);

      return true;
    } catch (e) {
      logger.error('Error sending Discord notification', {
        label: 'Notifications',
        message: e.message,
      });
      return false;
    }
  }
}

export default DiscordAgent;
