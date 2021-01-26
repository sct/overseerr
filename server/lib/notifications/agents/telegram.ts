import axios from 'axios';
import { hasNotificationType, Notification } from '..';
import logger from '../../../logger';
import { getSettings, NotificationAgentTelegram } from '../../settings';
import { BaseAgent, NotificationAgent, NotificationPayload } from './agent';

interface TelegramPayload {
  text: string;
  parse_mode: string;
  chat_id: string;
}

class TelegramAgent
  extends BaseAgent<NotificationAgentTelegram>
  implements NotificationAgent {
  private baseUrl = 'https://api.telegram.org/';

  protected getSettings(): NotificationAgentTelegram {
    if (this.settings) {
      return this.settings;
    }

    const settings = getSettings();

    return settings.notifications.agents.telegram;
  }

  public shouldSend(type: Notification): boolean {
    if (
      this.getSettings().enabled &&
      this.getSettings().options.botAPI &&
      this.getSettings().options.chatId &&
      hasNotificationType(type, this.getSettings().types)
    ) {
      return true;
    }

    return false;
  }

  private escapeText(text: string | undefined): string {
    return text ? text.replace(/[_*[\]()~>#+=|{}.!-]/gi, (x) => '\\' + x) : '';
  }

  private buildMessage(
    type: Notification,
    payload: NotificationPayload
  ): string {
    const settings = getSettings();
    let message = '';

    const title = this.escapeText(payload.subject);
    const plot = this.escapeText(payload.message);
    const user = this.escapeText(payload.notifyUser.displayName);

    /* eslint-disable no-useless-escape */
    switch (type) {
      case Notification.MEDIA_PENDING:
        message += `\*New Request\*\n`;
        message += `${title}\n\n`;
        message += `${plot}\n\n`;
        message += `\*Requested By\*\n${user}\n\n`;
        message += `\*Status\*\nPending Approval\n`;

        break;
      case Notification.MEDIA_APPROVED:
        message += `\*Request Approved\*\n`;
        message += `${title}\n\n`;
        message += `${plot}\n\n`;
        message += `\*Requested By\*\n${user}\n\n`;
        message += `\*Status\*\nProcessing Request\n`;

        break;
      case Notification.MEDIA_DECLINED:
        message += `\*Request Declined\*\n`;
        message += `${title}\n\n`;
        message += `${plot}\n\n`;
        message += `\*Requested By\*\n${user}\n\n`;
        message += `\*Status\*\nDeclined\n`;

        break;
      case Notification.MEDIA_AVAILABLE:
        message += `\*Now available\\!\*\n`;
        message += `${title}\n\n`;
        message += `${plot}\n\n`;
        message += `\*Requested By\*\n${user}\n\n`;
        message += `\*Status\*\nAvailable\n`;

        break;
      case Notification.TEST_NOTIFICATION:
        message += `\*Test Notification\*\n`;
        message += `${title}\n\n`;
        message += `${plot}\n\n`;
        message += `\*Requested By\*\n${user}\n`;

        break;
    }

    if (settings.main.applicationUrl && payload.media) {
      const actionUrl = `${settings.main.applicationUrl}/${payload.media.mediaType}/${payload.media.tmdbId}`;
      message += `\[Open in Overseerr\]\(${actionUrl}\)`;
    }
    /* eslint-enable */

    return message;
  }

  public async send(
    type: Notification,
    payload: NotificationPayload
  ): Promise<boolean> {
    logger.debug('Sending telegram notification', { label: 'Notifications' });
    try {
      const endpoint = `${this.baseUrl}bot${
        this.getSettings().options.botAPI
      }/sendMessage`;

      await axios.post(endpoint, {
        text: this.buildMessage(type, payload),
        parse_mode: 'MarkdownV2',
        chat_id: `${this.getSettings().options.chatId}`,
      } as TelegramPayload);

      return true;
    } catch (e) {
      logger.error('Error sending Telegram notification', {
        label: 'Notifications',
        message: e.message,
      });
      return false;
    }
  }
}

export default TelegramAgent;
