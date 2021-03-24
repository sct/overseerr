import axios from 'axios';
import { hasNotificationType, Notification } from '..';
import { MediaType } from '../../../constants/media';
import logger from '../../../logger';
import { getSettings, NotificationAgentTelegram } from '../../settings';
import { BaseAgent, NotificationAgent, NotificationPayload } from './agent';

interface TelegramMessagePayload {
  text: string;
  parse_mode: string;
  chat_id: string;
  disable_notification: boolean;
}

interface TelegramPhotoPayload {
  photo: string;
  caption: string;
  parse_mode: string;
  chat_id: string;
  disable_notification: boolean;
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
    const user = this.escapeText(payload.request?.requestedBy.displayName);
    const applicationTitle = this.escapeText(settings.main.applicationTitle);

    /* eslint-disable no-useless-escape */
    switch (type) {
      case Notification.MEDIA_PENDING:
        message += `\*New ${
          payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
        } Request\*`;
        message += `\n\n\*${title}\*`;
        if (plot) {
          message += `\n${plot}`;
        }
        message += `\n\n\*Requested By\*\n${user}`;
        message += `\n\n\*Status\*\nPending Approval`;
        break;
      case Notification.MEDIA_APPROVED:
        message += `\*${
          payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
        } Request Approved\*`;
        message += `\n\n\*${title}\*`;
        if (plot) {
          message += `\n${plot}`;
        }
        message += `\n\n\*Requested By\*\n${user}`;
        message += `\n\n\*Status\*\nProcessing`;
        break;
      case Notification.MEDIA_AUTO_APPROVED:
        message += `\*${
          payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
        } Request Automatically Approved\*`;
        message += `\n\n\*${title}\*`;
        if (plot) {
          message += `\n${plot}`;
        }
        message += `\n\n\*Requested By\*\n${user}`;
        message += `\n\n\*Status\*\nProcessing`;
        break;
      case Notification.MEDIA_AVAILABLE:
        message += `\*${
          payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
        } Now Available\*`;
        message += `\n\n\*${title}\*`;
        if (plot) {
          message += `\n${plot}`;
        }
        message += `\n\n\*Requested By\*\n${user}`;
        message += `\n\n\*Status\*\nAvailable`;
        break;
      case Notification.MEDIA_DECLINED:
        message += `\*${
          payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
        } Request Declined\*`;
        message += `\n\n\*${title}\*`;
        if (plot) {
          message += `\n${plot}`;
        }
        message += `\n\n\*Requested By\*\n${user}`;
        message += `\n\n\*Status\*\nDeclined`;
        break;
      case Notification.MEDIA_FAILED:
        message += `\*Failed ${
          payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
        } Request\*`;
        message += `\n\n\*${title}\*`;
        if (plot) {
          message += `\n${plot}`;
        }
        message += `\n\n\*Requested By\*\n${user}`;
        message += `\n\n\*Status\*\nFailed`;
        break;
      case Notification.TEST_NOTIFICATION:
        message += `\*Test Notification\*`;
        message += `\n\n${plot}`;
        break;
    }

    for (const extra of payload.extra ?? []) {
      message += `\n\n\*${extra.name}\*\n${extra.value}`;
    }

    if (settings.main.applicationUrl && payload.media) {
      const actionUrl = `${settings.main.applicationUrl}/${payload.media.mediaType}/${payload.media.tmdbId}`;
      message += `\n\n\[Open in ${applicationTitle}\]\(${actionUrl}\)`;
    }
    /* eslint-enable */

    return message;
  }

  public async send(
    type: Notification,
    payload: NotificationPayload
  ): Promise<boolean> {
    logger.debug('Sending Telegram notification', { label: 'Notifications' });

    const endpoint = `${this.baseUrl}bot${this.getSettings().options.botAPI}/${
      payload.image ? 'sendPhoto' : 'sendMessage'
    }`;

    // Send system notification
    try {
      await (payload.image
        ? axios.post(endpoint, {
            photo: payload.image,
            caption: this.buildMessage(type, payload),
            parse_mode: 'MarkdownV2',
            chat_id: this.getSettings().options.chatId,
            disable_notification: this.getSettings().options.sendSilently,
          } as TelegramPhotoPayload)
        : axios.post(endpoint, {
            text: this.buildMessage(type, payload),
            parse_mode: 'MarkdownV2',
            chat_id: `${this.getSettings().options.chatId}`,
            disable_notification: this.getSettings().options.sendSilently,
          } as TelegramMessagePayload));
    } catch (e) {
      logger.error('Error sending Telegram notification', {
        label: 'Notifications',
        message: e.message,
      });
      return false;
    }

    // Send user notification
    if (
      payload.notifyUser &&
      payload.notifyUser.settings?.enableTelegram &&
      payload.notifyUser.settings?.telegramChatId &&
      payload.notifyUser.settings?.telegramChatId !==
        this.getSettings().options.chatId
    ) {
      try {
        await (payload.image
          ? axios.post(endpoint, {
              photo: payload.image,
              caption: this.buildMessage(type, payload),
              parse_mode: 'MarkdownV2',
              chat_id: payload.notifyUser.settings.telegramChatId,
              disable_notification:
                payload.notifyUser.settings.telegramSendSilently,
            } as TelegramPhotoPayload)
          : axios.post(endpoint, {
              text: this.buildMessage(type, payload),
              parse_mode: 'MarkdownV2',
              chat_id: payload.notifyUser.settings.telegramChatId,
              disable_notification:
                payload.notifyUser.settings.telegramSendSilently,
            } as TelegramMessagePayload));
      } catch (e) {
        logger.error('Error sending Telegram notification', {
          label: 'Notifications',
          message: e.message,
        });
        return false;
      }
    }

    return true;
  }
}

export default TelegramAgent;
