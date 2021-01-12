import axios from 'axios';
import { get } from 'lodash';
import { hasNotificationType, Notification } from '..';
import { MediaStatus } from '../../../constants/media';
import logger from '../../../logger';
import { getSettings, NotificationAgentWebhook } from '../../settings';
import { BaseAgent, NotificationAgent, NotificationPayload } from './agent';

type KeyMapFunction = (
  payload: NotificationPayload,
  type: Notification
) => string;

const KeyMap: Record<string, string | KeyMapFunction> = {
  notification_type: (_payload, type) => Notification[type],
  subject: 'subject',
  message: 'message',
  image: 'image',
  notifyuser_username: 'notifyUser.username',
  notifyuser_email: 'notifyUser.email',
  notifyuser_avatar: 'notifyUser.avatar',
  media_tmdbid: 'media.tmdbId',
  media_imdbid: 'media.imdbId',
  media_tvdbid: 'media.tvdbId',
  media_type: 'media.mediaType',
  media_status: (payload) =>
    payload.media?.status ? MediaStatus[payload.media?.status] : '',
  media_status4k: (payload) =>
    payload.media?.status ? MediaStatus[payload.media?.status4k] : '',
};

class WebhookAgent
  extends BaseAgent<NotificationAgentWebhook>
  implements NotificationAgent {
  protected getSettings(): NotificationAgentWebhook {
    if (this.settings) {
      return this.settings;
    }

    const settings = getSettings();

    return settings.notifications.agents.webhook;
  }

  private parseKeys(
    finalPayload: Record<string, unknown>,
    payload: NotificationPayload,
    type: Notification
  ): Record<string, unknown> {
    Object.keys(finalPayload).forEach((key) => {
      if (key === '{{extra}}') {
        finalPayload.extra = payload.extra ?? [];
        delete finalPayload[key];
        key = 'extra';
      } else if (key === '{{media}}') {
        if (payload.media) {
          finalPayload.media = finalPayload[key];
        } else {
          finalPayload.media = null;
        }
        delete finalPayload[key];
        key = 'media';
      }

      if (typeof finalPayload[key] === 'string') {
        Object.keys(KeyMap).forEach((keymapKey) => {
          const keymapValue = KeyMap[keymapKey as keyof typeof KeyMap];
          finalPayload[key] = (finalPayload[key] as string).replace(
            `{{${keymapKey}}}`,
            typeof keymapValue === 'function'
              ? keymapValue(payload, type)
              : get(payload, keymapValue) ?? ''
          );
        });
      } else if (finalPayload[key] && typeof finalPayload[key] === 'object') {
        finalPayload[key] = this.parseKeys(
          finalPayload[key] as Record<string, unknown>,
          payload,
          type
        );
      }
    });

    return finalPayload;
  }

  private buildPayload(type: Notification, payload: NotificationPayload) {
    const payloadString = Buffer.from(
      this.getSettings().options.jsonPayload,
      'base64'
    ).toString('ascii');

    const parsedJSON = JSON.parse(JSON.parse(payloadString));

    return this.parseKeys(parsedJSON, payload, type);
  }

  public shouldSend(type: Notification): boolean {
    if (
      this.getSettings().enabled &&
      this.getSettings().options.webhookUrl &&
      hasNotificationType(type, this.getSettings().types)
    ) {
      return true;
    }

    return false;
  }

  public async send(
    type: Notification,
    payload: NotificationPayload
  ): Promise<boolean> {
    logger.debug('Sending webhook notification', { label: 'Notifications' });
    try {
      const webhookUrl = this.getSettings().options.webhookUrl;

      if (!webhookUrl) {
        return false;
      }

      await axios.post(webhookUrl, this.buildPayload(type, payload));

      return true;
    } catch (e) {
      logger.error('Error sending Webhook notification', {
        label: 'Notifications',
        errorMessage: e.message,
      });
      return false;
    }
  }
}

export default WebhookAgent;
