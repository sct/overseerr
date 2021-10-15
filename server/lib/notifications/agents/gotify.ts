import axios from 'axios';
import { hasNotificationType, Notification } from '..';
import { MediaType } from '../../../constants/media';
import logger from '../../../logger';
import { getSettings, NotificationAgentGotify } from '../../settings';
import { BaseAgent, NotificationAgent, NotificationPayload } from './agent';

interface GotifyPayload {
  token: string;
  user: string;
  title: string;
  message: string;
  priority: number;
  extras: any;
}

class GotifyAgent
  extends BaseAgent<NotificationAgentGotify>
  implements NotificationAgent
{
  protected getSettings(): NotificationAgentGotify {
    if (this.settings) {
      return this.settings;
    }

    const settings = getSettings();

    return settings.notifications.agents.gotify;
  }

  public shouldSend(): boolean {
    const settings = this.getSettings();

    if (settings.enabled && settings.options.url && settings.options.token) {
      return true;
    }

    return false;
  }

  private constructMessageDetails(
    type: Notification,
    payload: NotificationPayload
  ): {
    title: string;
    message: string;
    priority: number;
  } {
    const settings = getSettings();
    let messageTitle = '';
    let message = '';
    let priority = 0;

    const title = payload.subject;
    const plot = payload.message;
    const username = payload.request?.requestedBy.displayName;

    switch (type) {
      case Notification.MEDIA_PENDING:
        messageTitle = `New ${
          payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
        } Request`;
        message += `**${title}**`;
        if (plot) {
          message += `\n${plot}`;
        }
        message += `\n\n**Request By**\n${username}`;
        message += `\n\n**Status**\nPending Approval`;
        break;
      case Notification.MEDIA_APPROVED:
        messageTitle = `${
          payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
        } Request Approved`;
        message += `**${title}**`;
        if (plot) {
          message += `\n${plot}`;
        }
        message += `\n\n**Requested By**\n${username}`;
        message += `\n\n**Status**\nProcessing`;
        break;
      case Notification.MEDIA_AUTO_APPROVED:
        messageTitle = `${
          payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
        } Request Automatically Approved`;
        message += `**${title}**`;
        if (plot) {
          message += `\n${plot}`;
        }
        message += `\n\n**Requested By**\n${username}`;
        message += `\n\n**Status**\nProcessing`;
        break;
      case Notification.MEDIA_AVAILABLE:
        messageTitle = `${
          payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
        } Now Available`;
        message += `**${title}**`;
        if (plot) {
          message += `\n${plot}`;
        }
        message += `\n\n**Requested By**\n${username}`;
        message += `\n\n**Status**\nAvailable`;
        break;
      case Notification.MEDIA_DECLINED:
        messageTitle = `${
          payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
        } Request Declined`;
        message += `**${title}**`;
        if (plot) {
          message += `\n${plot}`;
        }
        message += `\n\n**Requested By**\n${username}`;
        message += `\n\n**Status**\nDeclined`;
        priority = 1;
        break;
      case Notification.MEDIA_FAILED:
        messageTitle = `${
          payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
        } Request`;
        message += `**${title}**`;
        if (plot) {
          message += `\n${plot}`;
        }
        message += `\n\n**Requested By**\n${username}`;
        message += `\n\n**Status**\nFailed`;
        priority = 1;
        break;
      case Notification.TEST_NOTIFICATION:
        messageTitle = 'Test Notification';
        message += `${plot}`;
        break;
    }

    for (const extra of payload.extra ?? []) {
      message += `\n\n**${extra.name}**\n${extra.value}`;
    }

    if (settings.main.applicationUrl && payload.media) {
      const actionUrl = `${settings.main.applicationUrl}/${payload.media.mediaType}/${payload.media.tmdbId}`;
      message += `\n\nOpen in ${settings.main.applicationTitle}(${actionUrl})`;
    }

    return {
      title: messageTitle,
      message,
      priority,
    };
  }

  public async send(
    type: Notification,
    payload: NotificationPayload
  ): Promise<boolean> {
    const settings = this.getSettings();

    if (!hasNotificationType(type, settings.types ?? 0)) {
      return true;
    }

    logger.debug('Sending Gotify notification', {
      label: 'Notifications',
      type: Notification[type],
      subject: payload.subject,
    });
    try {
      const endpoint = `${settings.options.url}/message?token=${settings.options.token}`;

      const { title, message, priority } = this.constructMessageDetails(
        type,
        payload
      );

      await axios.post(endpoint, {
        extras: {
          'client::display': {
            contentType: 'text/markdown',
          },
        },
        title: title,
        message: message,
        priority: priority,
      } as GotifyPayload);

      return true;
    } catch (e) {
      logger.error('Error sending Gotify notification', {
        label: 'Notifications',
        type: Notification[type],
        subject: payload.subject,
        errorMessage: e.message,
        response: e.response?.data,
      });

      return false;
    }
  }
}

export default GotifyAgent;
