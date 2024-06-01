import { IssueStatus, IssueTypeName } from '@server/constants/issue';
import { MediaStatus } from '@server/constants/media';
import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import type { NotificationAgentPushbullet } from '@server/lib/settings';
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

interface PushbulletPayload {
  type: string;
  title: string;
  body: string;
  channel_tag?: string;
}

class PushbulletAgent
  extends BaseAgent<NotificationAgentPushbullet>
  implements NotificationAgent
{
  protected getSettings(): NotificationAgentPushbullet {
    if (this.settings) {
      return this.settings;
    }

    const settings = getSettings();

    return settings.notifications.agents.pushbullet;
  }

  public shouldSend(): boolean {
    return true;
  }

  private getNotificationPayload(
    type: Notification,
    payload: NotificationPayload
  ): PushbulletPayload {
    const title = payload.event
      ? `${payload.event} - ${payload.subject}`
      : payload.subject;
    let body = payload.message ?? '';

    if (payload.request) {
      body += `\n\nDemandé par: ${payload.request.requestedBy.displayName}`;

      let status = '';
      switch (type) {
        case Notification.MEDIA_AUTO_REQUESTED:
          status =
            payload.media?.status === MediaStatus.PENDING
              ? 'Pending Approval'
              : 'Processing';
          break;
        case Notification.MEDIA_PENDING:
          status = 'En attente de validation';
          break;
        case Notification.MEDIA_APPROVED:
        case Notification.MEDIA_AUTO_APPROVED:
          status = 'Demandé';
          break;
        case Notification.MEDIA_AVAILABLE:
          status = 'Disponible';
          break;
        case Notification.MEDIA_DECLINED:
          status = 'Refusée';
          break;
        case Notification.MEDIA_FAILED:
          status = 'Échouée';
          break;
      }

      if (status) {
        body += `\nStatut de la demande: ${status}`;
      }
    } else if (payload.comment) {
      body += `\n\nCommenté par ${payload.comment.user.displayName}:\n${payload.comment.message}`;
    } else if (payload.issue) {
      body += `\n\nSignalé par : ${payload.issue.createdBy.displayName}`;
      body += `\nType d'issue : ${IssueTypeName[payload.issue.issueType]}`;
      body += `\nStatut de l'issue : ${
        payload.issue.status === IssueStatus.OPEN ? 'Ouverte' : 'Résolue'
      }`;
    }

    for (const extra of payload.extra ?? []) {
      body += `\n${extra.name}: ${extra.value}`;
    }

    return {
      type: 'note',
      title,
      body,
    };
  }

  public async send(
    type: Notification,
    payload: NotificationPayload
  ): Promise<boolean> {
    const settings = this.getSettings();
    const endpoint = 'https://api.pushbullet.com/v2/pushes';
    const notificationPayload = this.getNotificationPayload(type, payload);

    // Send system notification
    if (
      payload.notifySystem &&
      hasNotificationType(type, settings.types ?? 0) &&
      settings.enabled &&
      settings.options.accessToken
    ) {
      logger.debug('Sending Pushbullet notification', {
        label: 'Notifications',
        type: Notification[type],
        subject: payload.subject,
      });

      try {
        await axios.post(
          endpoint,
          { ...notificationPayload, channel_tag: settings.options.channelTag },
          {
            headers: {
              'Access-Token': settings.options.accessToken,
            },
          }
        );
      } catch (e) {
        logger.error('Error sending Pushbullet notification', {
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
          NotificationAgentKey.PUSHBULLET,
          type
        ) &&
        payload.notifyUser.settings?.pushbulletAccessToken &&
        payload.notifyUser.settings.pushbulletAccessToken !==
          settings.options.accessToken
      ) {
        logger.debug('Sending Pushbullet notification', {
          label: 'Notifications',
          recipient: payload.notifyUser.displayName,
          type: Notification[type],
          subject: payload.subject,
        });

        try {
          await axios.post(endpoint, notificationPayload, {
            headers: {
              'Access-Token': payload.notifyUser.settings.pushbulletAccessToken,
            },
          });
        } catch (e) {
          logger.error('Error sending Pushbullet notification', {
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
                NotificationAgentKey.PUSHBULLET,
                type
              ) && shouldSendAdminNotification(type, user, payload)
          )
          .map(async (user) => {
            if (
              user.settings?.pushbulletAccessToken &&
              (settings.options.channelTag ||
                user.settings.pushbulletAccessToken !==
                  settings.options.accessToken)
            ) {
              logger.debug('Sending Pushbullet notification', {
                label: 'Notifications',
                recipient: user.displayName,
                type: Notification[type],
                subject: payload.subject,
              });

              try {
                await axios.post(endpoint, notificationPayload, {
                  headers: {
                    'Access-Token': user.settings.pushbulletAccessToken,
                  },
                });
              } catch (e) {
                logger.error('Error sending Pushbullet notification', {
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

export default PushbulletAgent;
