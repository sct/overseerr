import axios from 'axios';
import { getRepository } from 'typeorm';
import {
  hasNotificationType,
  Notification,
  shouldSendAdminNotification,
} from '..';
import { IssueStatus, IssueTypeName } from '../../../constants/issue';
import { User } from '../../../entity/User';
import logger from '../../../logger';
import {
  getSettings,
  NotificationAgentKey,
  NotificationAgentTelegram,
} from '../../settings';
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
  implements NotificationAgent
{
  private baseUrl = 'https://api.telegram.org/';

  protected getSettings(): NotificationAgentTelegram {
    if (this.settings) {
      return this.settings;
    }

    const settings = getSettings();

    return settings.notifications.agents.telegram;
  }

  public shouldSend(): boolean {
    const settings = this.getSettings();

    if (settings.enabled && settings.options.botAPI) {
      return true;
    }

    return false;
  }

  private escapeText(text: string | undefined): string {
    return text ? text.replace(/[_*[\]()~>#+=|{}.!-]/gi, (x) => '\\' + x) : '';
  }

  private getNotificationPayload(
    type: Notification,
    payload: NotificationPayload
  ): Partial<TelegramMessagePayload | TelegramPhotoPayload> {
    const { applicationUrl, applicationTitle } = getSettings().main;
    const media =
      payload.request?.media ??
      payload.issue?.media ??
      payload.comment?.issue?.media;
    const issue = payload.issue ?? payload.comment?.issue;

    /* eslint-disable no-useless-escape */
    let message = `\*${this.escapeText(payload.event ?? payload.subject)}\*`;
    if (payload.event) {
      message += `\n\n\*${this.escapeText(payload.subject)}\*`;
    }
    if (payload.message) {
      message += `\n${this.escapeText(payload.message)}`;
    }

    if (payload.request) {
      message += `\n\n\*Requested By\*\n${this.escapeText(
        payload.request?.requestedBy.displayName
      )}`;

      let status = '';
      switch (type) {
        case Notification.MEDIA_PENDING:
          status = 'Pending Approval';
          break;
        case Notification.MEDIA_APPROVED:
        case Notification.MEDIA_AUTO_APPROVED:
          status = 'Processing';
          break;
        case Notification.MEDIA_AVAILABLE:
          status = 'Available';
          break;
        case Notification.MEDIA_DECLINED:
          status = 'Declined';
          break;
        case Notification.MEDIA_FAILED:
          status = 'Failed';
          break;
      }

      if (status) {
        message += `\n\n\*Request Status\*\n${status}`;
      }
    } else if (payload.issue) {
      message += `\n\n\*Reported By\*\n${this.escapeText(
        payload.issue.createdBy.displayName
      )}`;
      message += `\n\*Issue Type\*\n${IssueTypeName[payload.issue.issueType]}`;
      message += `\n\*Issue Status\*\n${
        payload.issue.status === IssueStatus.OPEN ? 'Open' : 'Resolved'
      }`;
    } else if (payload.comment) {
      message += `\n\n\*Comment from ${this.escapeText(
        payload.comment.user.displayName
      )}\*\n${this.escapeText(payload.comment.message)}`;
    }

    for (const extra of payload.extra ?? []) {
      message += `\n\n\*${extra.name}\*\n${extra.value}`;
    }

    const url = applicationUrl
      ? issue
        ? `${applicationUrl}/issue/${issue.id}`
        : media
        ? `${applicationUrl}/${media.mediaType}/${media.tmdbId}`
        : undefined
      : undefined;

    if (url) {
      message += `\n\n\[View ${
        payload.issue ? 'Issue' : 'Media'
      } in ${this.escapeText(applicationTitle)}\]\(${url}\)`;
    }
    /* eslint-enable */

    return payload.image
      ? {
          photo: payload.image,
          caption: message,
          parse_mode: 'MarkdownV2',
        }
      : {
          text: message,
          parse_mode: 'MarkdownV2',
        };
  }

  public async send(
    type: Notification,
    payload: NotificationPayload
  ): Promise<boolean> {
    const settings = this.getSettings();
    const endpoint = `${this.baseUrl}bot${settings.options.botAPI}/${
      payload.image ? 'sendPhoto' : 'sendMessage'
    }`;
    const notificationPayload = this.getNotificationPayload(type, payload);

    // Send system notification
    if (
      hasNotificationType(type, settings.types ?? 0) &&
      settings.options.chatId
    ) {
      logger.debug('Sending Telegram notification', {
        label: 'Notifications',
        type: Notification[type],
        subject: payload.subject,
      });

      try {
        await axios.post(endpoint, {
          ...notificationPayload,
          chat_id: settings.options.chatId,
          disable_notification: !!settings.options.sendSilently,
        } as TelegramMessagePayload | TelegramPhotoPayload);
      } catch (e) {
        logger.error('Error sending Telegram notification', {
          label: 'Notifications',
          type: Notification[type],
          subject: payload.subject,
          errorMessage: e.message,
          response: e.response?.data,
        });

        return false;
      }
    }

    if (payload.notifyUser) {
      // Send notification to the target user
      if (
        payload.notifyUser.settings?.hasNotificationType(
          NotificationAgentKey.TELEGRAM,
          type
        ) &&
        payload.notifyUser.settings?.telegramChatId &&
        payload.notifyUser.settings.telegramChatId !== settings.options.chatId
      ) {
        logger.debug('Sending Telegram notification', {
          label: 'Notifications',
          recipient: payload.notifyUser.displayName,
          type: Notification[type],
          subject: payload.subject,
        });

        try {
          await axios.post(endpoint, {
            ...notificationPayload,
            chat_id: payload.notifyUser.settings.telegramChatId,
            disable_notification:
              !!payload.notifyUser.settings.telegramSendSilently,
          } as TelegramMessagePayload | TelegramPhotoPayload);
        } catch (e) {
          logger.error('Error sending Telegram notification', {
            label: 'Notifications',
            recipient: payload.notifyUser.displayName,
            type: Notification[type],
            subject: payload.subject,
            errorMessage: e.message,
            response: e.response?.data,
          });

          return false;
        }
      }
    } else {
      // Send notifications to all users with the relevant management permission
      const userRepository = getRepository(User);
      const users = await userRepository.find();

      await Promise.all(
        users
          .filter(
            (user) =>
              user.settings?.hasNotificationType(
                NotificationAgentKey.TELEGRAM,
                type
              ) && shouldSendAdminNotification(type, user, payload)
          )
          .map(async (user) => {
            if (
              user.settings?.telegramChatId &&
              user.settings.telegramChatId !== settings.options.chatId
            ) {
              logger.debug('Sending Telegram notification', {
                label: 'Notifications',
                recipient: user.displayName,
                type: Notification[type],
                subject: payload.subject,
              });

              try {
                await axios.post(endpoint, {
                  ...notificationPayload,
                  chat_id: user.settings.telegramChatId,
                  disable_notification: !!user.settings?.telegramSendSilently,
                } as TelegramMessagePayload | TelegramPhotoPayload);
              } catch (e) {
                logger.error('Error sending Telegram notification', {
                  label: 'Notifications',
                  recipient: user.displayName,
                  type: Notification[type],
                  subject: payload.subject,
                  errorMessage: e.message,
                  response: e.response?.data,
                });

                return false;
              }
            }
          })
      );
    }

    return true;
  }
}

export default TelegramAgent;
