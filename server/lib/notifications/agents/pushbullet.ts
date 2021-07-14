import axios from 'axios';
import { getRepository } from 'typeorm';
import { hasNotificationType, Notification } from '..';
import { MediaType } from '../../../constants/media';
import { User } from '../../../entity/User';
import logger from '../../../logger';
import { Permission } from '../../permissions';
import {
  getSettings,
  NotificationAgentKey,
  NotificationAgentPushbullet,
} from '../../settings';
import { BaseAgent, NotificationAgent, NotificationPayload } from './agent';

interface PushbulletPayload {
  type: string;
  title: string;
  body: string;
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
    let messageTitle = '';
    let message = '';

    const title = payload.subject;
    const plot = payload.message;
    const username = payload.request?.requestedBy.displayName;

    switch (type) {
      case Notification.MEDIA_PENDING:
        messageTitle = `New ${
          payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
        } Request`;
        message += `${title}`;
        if (plot) {
          message += `\n\n${plot}`;
        }
        message += `\n\nRequested By: ${username}`;
        message += `\nStatus: Pending Approval`;
        break;
      case Notification.MEDIA_APPROVED:
        messageTitle = `${
          payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
        } Request Approved`;
        message += `${title}`;
        if (plot) {
          message += `\n\n${plot}`;
        }
        message += `\n\nRequested By: ${username}`;
        message += `\nStatus: Processing`;
        break;
      case Notification.MEDIA_AUTO_APPROVED:
        messageTitle = `${
          payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
        } Request Automatically Approved`;
        message += `${title}`;
        if (plot) {
          message += `\n\n${plot}`;
        }
        message += `\n\nRequested By: ${username}`;
        message += `\nStatus: Processing`;
        break;
      case Notification.MEDIA_AVAILABLE:
        messageTitle = `${
          payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
        } Now Available`;
        message += `${title}`;
        if (plot) {
          message += `\n\n${plot}`;
        }
        message += `\n\nRequested By: ${username}`;
        message += `\nStatus: Available`;
        break;
      case Notification.MEDIA_DECLINED:
        messageTitle = `${
          payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
        } Request Declined`;
        message += `${title}`;
        if (plot) {
          message += `\n\n${plot}`;
        }
        message += `\n\nRequested By: ${username}`;
        message += `\nStatus: Declined`;
        break;
      case Notification.MEDIA_FAILED:
        messageTitle = `Failed ${
          payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
        } Request`;
        message += `${title}`;
        if (plot) {
          message += `\n\n${plot}`;
        }
        message += `\n\nRequested By: ${username}`;
        message += `\nStatus: Failed`;
        break;
      case Notification.TEST_NOTIFICATION:
        messageTitle = 'Test Notification';
        message += `${plot}`;
        break;
    }

    for (const extra of payload.extra ?? []) {
      message += `\n${extra.name}: ${extra.value}`;
    }

    return {
      type: 'note',
      title: messageTitle,
      body: message,
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
        await axios.post(endpoint, notificationPayload, {
          headers: {
            'Access-Token': settings.options.accessToken,
          },
        });
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
      // Send notification to the user who submitted the request
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
    } else {
      // Send notifications to all users with the Manage Requests permission
      const userRepository = getRepository(User);
      const users = await userRepository.find();

      await Promise.all(
        users
          .filter(
            (user) =>
              user.hasPermission(Permission.MANAGE_REQUESTS) &&
              user.settings?.hasNotificationType(
                NotificationAgentKey.PUSHBULLET,
                type
              ) &&
              // Check if it's the user's own auto-approved request
              (type !== Notification.MEDIA_AUTO_APPROVED ||
                user.id !== payload.request?.requestedBy.id)
          )
          .map(async (user) => {
            if (
              user.settings?.pushbulletAccessToken &&
              user.settings.pushbulletAccessToken !==
                settings.options.accessToken
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
