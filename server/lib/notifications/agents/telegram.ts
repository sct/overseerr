import { IssueStatus, IssueTypeName } from '@server/constants/issue';
import { MediaStatus } from '@server/constants/media';
import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import type { NotificationAgentTelegram } from '@server/lib/settings';
import { getSettings, NotificationAgentKey } from '@server/lib/settings';
import logger from '@server/logger';
import axios from 'axios';
import {
  hasNotificationType,
  Notification,
  shouldSendAdminNotification,
} from '..';
import type { NotificationAgent, NotificationPayload } from './agent';
import { BaseAgent } from './agent';

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

enum TelegramMessageType {
  PHOTO = 'PHOTO',
  TEXT = 'TEXT',
}

interface TelegramMessageRecipient {
  name: string;
  chatId: string;
  sendSilent: boolean;
}

class TelegramMessageChain {
  readonly #endpoints: { [key: string]: string } = {};

  private recipients: TelegramMessageRecipient[] = [];

  private notificationType: Notification;
  private subject: string;
  private messageType: TelegramMessageType;
  private messagePayload: Partial<
    TelegramMessagePayload | TelegramPhotoPayload
  >;

  constructor(apiUrl: string, apiKey: string) {
    this.#endpoints[
      TelegramMessageType.TEXT
    ] = `${apiUrl}bot${apiKey}/sendMessage`;
    this.#endpoints[
      TelegramMessageType.PHOTO
    ] = `${apiUrl}bot${apiKey}/sendPhoto`;
  }

  public initialize(
    type: Notification,
    subject: string,
    payload: Partial<TelegramMessagePayload | TelegramPhotoPayload>
  ): TelegramMessageChain {
    this.notificationType = type;
    this.subject = subject;
    this.messageType =
      'photo' in payload ? TelegramMessageType.PHOTO : TelegramMessageType.TEXT;
    this.messagePayload = payload;

    return this;
  }

  public addRecipient(
    chatId: string,
    sendSilent: boolean,
    recipient = 'SYSTEM'
  ): void {
    this.recipients.push({ name: recipient, chatId, sendSilent });
  }

  public async execute(): Promise<boolean> {
    if (this.recipients.length == 0) {
      return true;
    }
    return this.recipients
      .reduce((current, next) => {
        return current.then(() => this.sendTo(next));
      }, Promise.resolve<unknown>(null))
      .then(() => true);
  }

  private fallbackToTxtFormat() {
    this.messageType = TelegramMessageType.TEXT;
    this.messagePayload = {
      text: (this.messagePayload as TelegramPhotoPayload).caption,
      parse_mode: this.messagePayload.parse_mode,
    } as Partial<TelegramMessagePayload>;
  }

  private sendTo(recipient: TelegramMessageRecipient): Promise<unknown> {
    logger.debug(`Sending Telegram notification (${this.messageType})`, {
      label: 'Notifications',
      recipient: recipient.name,
      type: Notification[this.notificationType],
      subject: this.subject,
    });

    return axios
      .post(this.#endpoints[this.messageType], {
        ...this.messagePayload,
        chat_id: recipient.chatId,
        disable_notification: !!recipient.sendSilent,
      } as TelegramMessagePayload | TelegramPhotoPayload)
      .catch((e) => {
        logger.error(
          `Error sending Telegram notification (${this.messageType})`,
          {
            label: 'Notifications',
            recipient: recipient.name,
            type: Notification[this.notificationType],
            subject: this.subject,
            errorMessage: e.message,
            response: e.response?.data,
          }
        );

        if (
          TelegramMessageType.PHOTO == this.messageType &&
          e.response?.data?.description &&
          e.response.data.description
            .toLowerCase()
            .indexOf('wrong file identifier/http url specified') >= 0
        ) {
          this.fallbackToTxtFormat();
          return this.sendTo(recipient);
        } else {
          return Promise.reject(e);
        }
      });
  }
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

    /* eslint-disable no-useless-escape */
    let message = `\*${this.escapeText(
      payload.event ? `${payload.event} - ${payload.subject}` : payload.subject
    )}\*`;
    if (payload.message) {
      message += `\n${this.escapeText(payload.message)}`;
    }

    if (payload.request) {
      message += `\n\n\*Requested By:\* ${this.escapeText(
        payload.request?.requestedBy.displayName
      )}`;

      let status = '';
      switch (type) {
        case Notification.MEDIA_AUTO_REQUESTED:
          status =
            payload.media?.status === MediaStatus.PENDING
              ? 'Pending Approval'
              : 'Processing';
          break;
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
        message += `\n\*Request Status:\* ${status}`;
      }
    } else if (payload.comment) {
      message += `\n\n\*Comment from ${this.escapeText(
        payload.comment.user.displayName
      )}:\* ${this.escapeText(payload.comment.message)}`;
    } else if (payload.issue) {
      message += `\n\n\*Reported By:\* ${this.escapeText(
        payload.issue.createdBy.displayName
      )}`;
      message += `\n\*Issue Type:\* ${IssueTypeName[payload.issue.issueType]}`;
      message += `\n\*Issue Status:\* ${
        payload.issue.status === IssueStatus.OPEN ? 'Open' : 'Resolved'
      }`;
    }

    for (const extra of payload.extra ?? []) {
      message += `\n\*${extra.name}:\* ${extra.value}`;
    }

    const url = applicationUrl
      ? payload.issue
        ? `${applicationUrl}/issues/${payload.issue.id}`
        : payload.media
        ? `${applicationUrl}/${payload.media.mediaType}/${payload.media.tmdbId}`
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
    const notificationPayload = this.getNotificationPayload(type, payload);

    const sender = new TelegramMessageChain(
      this.baseUrl,
      settings.options.botAPI
    ).initialize(type, payload.subject, notificationPayload);

    // Send system notification
    if (
      payload.notifySystem &&
      hasNotificationType(type, settings.types ?? 0) &&
      settings.options.chatId
    ) {
      sender.addRecipient(
        settings.options.chatId,
        settings.options.sendSilently
      );
    }

    if (payload.notifyUser) {
      if (
        payload.notifyUser.settings?.hasNotificationType(
          NotificationAgentKey.TELEGRAM,
          type
        ) &&
        payload.notifyUser.settings?.telegramChatId &&
        payload.notifyUser.settings.telegramChatId !== settings.options.chatId
      ) {
        sender.addRecipient(
          payload.notifyUser.settings.telegramChatId,
          payload.notifyUser.settings.telegramSendSilently ?? false,
          payload.notifyUser.displayName
        );
      }
    }

    if (payload.notifyAdmin) {
      const userRepository = getRepository(User);
      const users = await userRepository.find();

      users
        .filter(
          (user) =>
            user.settings?.hasNotificationType(
              NotificationAgentKey.TELEGRAM,
              type
            ) && shouldSendAdminNotification(type, user, payload)
        )
        .forEach((user) => {
          if (
            user.settings?.telegramChatId &&
            user.settings.telegramChatId !== settings.options.chatId
          ) {
            sender.addRecipient(
              user.settings.telegramChatId,
              user.settings?.telegramSendSilently ?? false,
              user.displayName
            );
          }
        });
    }

    return sender.execute().catch(() => false);
  }
}

export default TelegramAgent;
