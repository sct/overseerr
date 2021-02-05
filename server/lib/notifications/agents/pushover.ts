import axios from 'axios';
import { hasNotificationType, Notification } from '..';
import logger from '../../../logger';
import { getSettings, NotificationAgentPushover } from '../../settings';
import { BaseAgent, NotificationAgent, NotificationPayload } from './agent';

interface PushoverPayload {
  token: string;
  user: string;
  title: string;
  message: string;
  html: number;
}

class PushoverAgent
  extends BaseAgent<NotificationAgentPushover>
  implements NotificationAgent {
  protected getSettings(): NotificationAgentPushover {
    if (this.settings) {
      return this.settings;
    }

    const settings = getSettings();

    return settings.notifications.agents.pushover;
  }

  public shouldSend(type: Notification): boolean {
    if (
      this.getSettings().enabled &&
      this.getSettings().options.accessToken &&
      this.getSettings().options.userToken &&
      hasNotificationType(type, this.getSettings().types)
    ) {
      return true;
    }

    return false;
  }

  private constructMessageDetails(
    type: Notification,
    payload: NotificationPayload
  ): { title: string; message: string } {
    const settings = getSettings();
    let messageTitle = '';
    let message = '';

    const title = payload.subject;
    const plot = payload.message;
    const username = payload.notifyUser.displayName;

    switch (type) {
      case Notification.MEDIA_PENDING:
        messageTitle = 'New Request';
        message += `${title}\n\n`;
        message += `${plot}\n\n`;
        message += `<b>Requested By</b>\n${username}\n\n`;
        message += `<b>Status</b>\nPending Approval\n`;
        break;
      case Notification.MEDIA_APPROVED:
        messageTitle = 'Request Approved';
        message += `${title}\n\n`;
        message += `${plot}\n\n`;
        message += `<b>Requested By</b>\n${username}\n\n`;
        message += `<b>Status</b>\nProcessing Request\n`;
        break;
      case Notification.MEDIA_AVAILABLE:
        messageTitle = 'Now Available';
        message += `${title}\n\n`;
        message += `${plot}\n\n`;
        message += `<b>Requested By</b>\n${username}\n\n`;
        message += `<b>Status</b>\nAvailable\n`;
        break;
      case Notification.MEDIA_DECLINED:
        messageTitle = 'Request Declined';
        message += `${title}\n\n`;
        message += `${plot}\n\n`;
        message += `<b>Requested By</b>\n${username}\n\n`;
        message += `<b>Status</b>\nDeclined\n`;
        break;
      case Notification.TEST_NOTIFICATION:
        messageTitle = 'Test Notification';
        message += `${plot}\n\n`;
        message += `<b>Requested By</b>\n${username}\n`;
        break;
    }

    if (settings.main.applicationUrl && payload.media) {
      const actionUrl = `${settings.main.applicationUrl}/${payload.media.mediaType}/${payload.media.tmdbId}`;
      message += `<a href="${actionUrl}">Open in ${settings.main.applicationTitle}</a>`;
    }

    return { title: messageTitle, message };
  }

  public async send(
    type: Notification,
    payload: NotificationPayload
  ): Promise<boolean> {
    logger.debug('Sending Pushover notification', { label: 'Notifications' });
    try {
      const endpoint = 'https://api.pushover.net/1/messages.json';

      const { accessToken, userToken } = this.getSettings().options;

      const { title, message } = this.constructMessageDetails(type, payload);

      await axios.post(endpoint, {
        token: accessToken,
        user: userToken,
        title: title,
        message: message,
        html: 1,
      } as PushoverPayload);

      return true;
    } catch (e) {
      logger.error('Error sending Pushover notification', {
        label: 'Notifications',
        message: e.message,
      });
      return false;
    }
  }
}

export default PushoverAgent;
