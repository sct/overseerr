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
  NotificationAgentPushover,
} from '../../settings';
import { BaseAgent, NotificationAgent, NotificationPayload } from './agent';

interface PushoverPayload {
  token: string;
  user: string;
  title: string;
  message: string;
  url: string;
  url_title: string;
  priority: number;
  html: number;
}

class PushoverAgent
  extends BaseAgent<NotificationAgentPushover>
  implements NotificationAgent
{
  protected getSettings(): NotificationAgentPushover {
    if (this.settings) {
      return this.settings;
    }

    const settings = getSettings();

    return settings.notifications.agents.pushover;
  }

  public shouldSend(): boolean {
    return true;
  }

  private getNotificationPayload(
    type: Notification,
    payload: NotificationPayload
  ): Partial<PushoverPayload> {
    const { applicationUrl, applicationTitle } = getSettings().main;

    const title = payload.event ?? payload.subject;
    let message = payload.event ? `<b>${payload.subject}</b>` : '';
    let priority = 0;

    if (payload.message) {
      message += `<small>${message ? '\n' : ''}${payload.message}</small>`;
    }

    if (payload.request) {
      message += `<small>\n\n<b>Requested By:</b> ${payload.request.requestedBy.displayName}</small>`;

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
          priority = 1;
          break;
        case Notification.MEDIA_FAILED:
          status = 'Failed';
          priority = 1;
          break;
      }

      if (status) {
        message += `<small>\n<b>Request Status:</b> ${status}</small>`;
      }
    } else if (payload.comment) {
      message += `<small>\n\n<b>Comment from ${payload.comment.user.displayName}:</b> ${payload.comment.message}</small>`;
    } else if (payload.issue) {
      message += `<small>\n\n<b>Reported By:</b> ${payload.issue.createdBy.displayName}</small>`;
      message += `<small>\n<b>Issue Type:</b> ${
        IssueTypeName[payload.issue.issueType]
      }</small>`;
      message += `<small>\n<b>Issue Status:</b> ${
        payload.issue.status === IssueStatus.OPEN ? 'Open' : 'Resolved'
      }</small>`;

      if (type === Notification.ISSUE_CREATED) {
        priority = 1;
      }
    }

    for (const extra of payload.extra ?? []) {
      message += `<small>\n<b>${extra.name}:</b> ${extra.value}</small>`;
    }

    const url = applicationUrl
      ? payload.issue
        ? `${applicationUrl}/issues/${payload.issue.id}`
        : payload.media
        ? `${applicationUrl}/${payload.media.mediaType}/${payload.media.tmdbId}`
        : undefined
      : undefined;
    const url_title = url
      ? `View ${payload.issue ? 'Issue' : 'Media'} in ${applicationTitle}`
      : undefined;

    return {
      title,
      message,
      url,
      url_title,
      priority,
      html: 1,
    };
  }

  public async send(
    type: Notification,
    payload: NotificationPayload
  ): Promise<boolean> {
    const settings = this.getSettings();
    const endpoint = 'https://api.pushover.net/1/messages.json';
    const notificationPayload = this.getNotificationPayload(type, payload);

    // Send system notification
    if (
      hasNotificationType(type, settings.types ?? 0) &&
      settings.enabled &&
      settings.options.accessToken &&
      settings.options.userToken
    ) {
      logger.debug('Sending Pushover notification', {
        label: 'Notifications',
        type: Notification[type],
        subject: payload.subject,
      });

      try {
        await axios.post(endpoint, {
          ...notificationPayload,
          token: settings.options.accessToken,
          user: settings.options.userToken,
        } as PushoverPayload);
      } catch (e) {
        logger.error('Error sending Pushover notification', {
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
      if (
        payload.notifyUser.settings?.hasNotificationType(
          NotificationAgentKey.PUSHOVER,
          type
        ) &&
        payload.notifyUser.settings.pushoverApplicationToken &&
        payload.notifyUser.settings.pushoverUserKey &&
        (payload.notifyUser.settings.pushoverApplicationToken !==
          settings.options.accessToken ||
          payload.notifyUser.settings.pushoverUserKey !==
            settings.options.userToken)
      ) {
        logger.debug('Sending Pushover notification', {
          label: 'Notifications',
          recipient: payload.notifyUser.displayName,
          type: Notification[type],
          subject: payload.subject,
        });

        try {
          await axios.post(endpoint, {
            ...notificationPayload,
            token: payload.notifyUser.settings.pushoverApplicationToken,
            user: payload.notifyUser.settings.pushoverUserKey,
          } as PushoverPayload);
        } catch (e) {
          logger.error('Error sending Pushover notification', {
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
    }

    if (payload.notifyAdmin) {
      const userRepository = getRepository(User);
      const users = await userRepository.find();

      await Promise.all(
        users
          .filter(
            (user) =>
              user.settings?.hasNotificationType(
                NotificationAgentKey.PUSHOVER,
                type
              ) && shouldSendAdminNotification(type, user, payload)
          )
          .map(async (user) => {
            if (
              user.settings?.pushoverApplicationToken &&
              user.settings?.pushoverUserKey &&
              user.settings.pushoverApplicationToken !==
                settings.options.accessToken &&
              user.settings.pushoverUserKey !== settings.options.userToken
            ) {
              logger.debug('Sending Pushover notification', {
                label: 'Notifications',
                recipient: user.displayName,
                type: Notification[type],
                subject: payload.subject,
              });

              try {
                await axios.post(endpoint, {
                  ...notificationPayload,
                  token: user.settings.pushoverApplicationToken,
                  user: user.settings.pushoverUserKey,
                } as PushoverPayload);
              } catch (e) {
                logger.error('Error sending Pushover notification', {
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

export default PushoverAgent;
