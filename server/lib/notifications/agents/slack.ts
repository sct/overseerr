import axios from 'axios';
import { Notification } from '..';
import logger from '../../../logger';
import { getSettings, NotificationAgentSlack } from '../../settings';
import { BaseAgent, NotificationAgent, NotificationPayload } from './agent';

interface EmbedField {
  type: 'plain_text' | 'mrkdwn';
  text: string;
}

interface TextItem {
  type: 'plain_text' | 'mrkdwn';
  text: string;
  emoji?: boolean;
}

interface Element {
  type: 'button';
  text?: TextItem;
  value: string;
  url: string;
  action_id: 'button-action';
}

interface EmbedBlock {
  type: 'header' | 'actions' | 'section' | 'context';
  block_id?: 'section789';
  text?: TextItem;
  fields?: EmbedField[];
  accessory?: {
    type: 'image';
    image_url: string;
    alt_text: string;
  };
  elements?: Element[];
}

interface SlackBlockEmbed {
  blocks: EmbedBlock[];
}

class SlackAgent
  extends BaseAgent<NotificationAgentSlack>
  implements NotificationAgent {
  protected getSettings(): NotificationAgentSlack {
    if (this.settings) {
      return this.settings;
    }

    const settings = getSettings();

    return settings.notifications.agents.slack;
  }

  public buildEmbed(
    type: Notification,
    payload: NotificationPayload
  ): SlackBlockEmbed {
    const settings = getSettings();
    let header = 'Overseerr';
    let actionUrl: string | undefined;

    const fields: EmbedField[] = [];

    switch (type) {
      case Notification.MEDIA_PENDING:
        header = 'New Request';
        fields.push(
          {
            type: 'mrkdwn',
            text: `*Requested By*\n${payload.notifyUser.username ?? ''}`,
          },
          {
            type: 'mrkdwn',
            text: '*Status*\nPending Approval',
          }
        );
        if (settings.main.applicationUrl) {
          actionUrl = `${settings.main.applicationUrl}/${payload.media?.mediaType}/${payload.media?.tmdbId}`;
        }
        break;
      case Notification.MEDIA_APPROVED:
        header = 'Request Approved';
        fields.push(
          {
            type: 'mrkdwn',
            text: `*Requested By*\n${payload.notifyUser.username ?? ''}`,
          },
          {
            type: 'mrkdwn',
            text: '*Status*\nProcessing Request',
          }
        );
        if (settings.main.applicationUrl) {
          actionUrl = `${settings.main.applicationUrl}/${payload.media?.mediaType}/${payload.media?.tmdbId}`;
        }
        break;
      case Notification.MEDIA_AVAILABLE:
        header = 'Now available!';
        fields.push(
          {
            type: 'mrkdwn',
            text: `*Requested By*\n${payload.notifyUser.username ?? ''}`,
          },
          {
            type: 'mrkdwn',
            text: '*Status*\nAvailable',
          }
        );

        if (settings.main.applicationUrl) {
          actionUrl = `${settings.main.applicationUrl}/${payload.media?.mediaType}/${payload.media?.tmdbId}`;
        }
        break;
    }

    const blocks: EmbedBlock[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: header,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${payload.subject}*`,
        },
      },
    ];

    if (payload.message) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: payload.message,
        },
        accessory: payload.image
          ? {
              type: 'image',
              image_url: payload.image,
              alt_text: payload.subject,
            }
          : undefined,
      });
    }

    if (fields.length > 0) {
      blocks.push({
        type: 'section',
        fields: [
          ...fields,
          ...(payload.extra ?? []).map(
            (extra): EmbedField => ({
              type: 'mrkdwn',
              text: `*${extra.name}*\n${extra.value}`,
            })
          ),
        ],
      });
    }

    if (actionUrl) {
      blocks.push({
        type: 'actions',
        elements: [
          {
            action_id: 'button-action',
            type: 'button',
            url: actionUrl,
            value: 'open_overseerr',
            text: {
              type: 'plain_text',
              text: 'Open Overseerr',
            },
          },
        ],
      });
    }

    return {
      blocks,
    };
  }

  // TODO: Add checking for type here once we add notification type filters for agents
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public shouldSend(_type: Notification): boolean {
    if (this.getSettings().enabled && this.getSettings().options.webhookUrl) {
      return true;
    }

    return false;
  }

  public async send(
    type: Notification,
    payload: NotificationPayload
  ): Promise<boolean> {
    logger.debug('Sending slack notification', { label: 'Notifications' });
    try {
      const webhookUrl = this.getSettings().options.webhookUrl;

      if (!webhookUrl) {
        return false;
      }

      await axios.post(webhookUrl, this.buildEmbed(type, payload));

      return true;
    } catch (e) {
      logger.error('Error sending Slack notification', {
        label: 'Notifications',
        message: e.message,
      });
      return false;
    }
  }
}

export default SlackAgent;
