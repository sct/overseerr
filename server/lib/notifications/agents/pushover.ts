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
    const settings = getSettings();
    let messageTitle = '';
    let message = '';
    let url: string | undefined;
    let url_title: string | undefined;
    let priority = 0;

    const title = payload.subject;
    const plot = payload.message;
    const username = payload.request?.requestedBy.displayName;

    switch (type) {
      case Notification.MEDIA_PENDING:
        messageTitle = `New ${
          payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
        } Request`;
        message += `<b>${title}</b>`;
        if (plot) {
          message += `<small>\n${plot}</small>`;
        }
        message += `<small>\n\n<b>Requested By</b>\n${username}</small>`;
        message += `<small>\n\n<b>Status</b>\nPending Approval</small>`;
        break;
      case Notification.MEDIA_APPROVED:
        messageTitle = `${
          payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
        } Request Approved`;
        message += `<b>${title}</b>`;
        if (plot) {
          message += `<small>\n${plot}</small>`;
        }
        message += `<small>\n\n<b>Requested By</b>\n${username}</small>`;
        message += `<small>\n\n<b>Status</b>\nProcessing</small>`;
        break;
      case Notification.MEDIA_AUTO_APPROVED:
        messageTitle = `${
          payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
        } Request Automatically Approved`;
        message += `<b>${title}</b>`;
        if (plot) {
          message += `<small>\n${plot}</small>`;
        }
        message += `<small>\n\n<b>Requested By</b>\n${username}</small>`;
        message += `<small>\n\n<b>Status</b>\nProcessing</small>`;
        break;
      case Notification.MEDIA_AVAILABLE:
        messageTitle = `${
          payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
        } Now Available`;
        message += `<b>${title}</b>`;
        if (plot) {
          message += `<small>\n${plot}</small>`;
        }
        message += `<small>\n\n<b>Requested By</b>\n${username}</small>`;
        message += `<small>\n\n<b>Status</b>\nAvailable</small>`;
        break;
      case Notification.MEDIA_DECLINED:
        messageTitle = `${
          payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
        } Request Declined`;
        message += `<b>${title}</b>`;
        if (plot) {
          message += `<small>\n${plot}</small>`;
        }
        message += `<small>\n\n<b>Requested By</b>\n${username}</small>`;
        message += `<small>\n\n<b>Status</b>\nDeclined</small>`;
        priority = 1;
        break;
      case Notification.MEDIA_FAILED:
        messageTitle = `Failed ${
          payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
        } Request`;
        message += `<b>${title}</b>`;
        if (plot) {
          message += `<small>\n${plot}</small>`;
        }
        message += `<small>\n\n<b>Requested By</b>\n${username}</small>`;
        message += `<small>\n\n<b>Status</b>\nFailed</small>`;
        priority = 1;
        break;
      case Notification.TEST_NOTIFICATION:
        messageTitle = 'Test Notification';
        message += `<small>${plot}</small>`;
        break;
    }

    for (const extra of payload.extra ?? []) {
      message += `<small>\n\n<b>${extra.name}</b>\n${extra.value}</small>`;
    }

    if (settings.main.applicationUrl && payload.media) {
      url = `${settings.main.applicationUrl}/${payload.media.mediaType}/${payload.media.tmdbId}`;
      url_title = `Open in ${settings.main.applicationTitle}`;
    }

    return {
      title: messageTitle,
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
      // Send notification to the user who submitted the request
      if (
        payload.notifyUser.settings?.hasNotificationType(
          NotificationAgentKey.PUSHOVER,
          type
        ) &&
        payload.notifyUser.settings?.pushoverApplicationToken &&
        payload.notifyUser.settings?.pushoverUserKey &&
        payload.notifyUser.settings.pushoverApplicationToken !==
          settings.options.accessToken &&
        payload.notifyUser.settings?.pushoverUserKey !==
          settings.options.userToken
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
                NotificationAgentKey.PUSHOVER,
                type
              ) &&
              // Check if it's the user's own auto-approved request
              (type !== Notification.MEDIA_AUTO_APPROVED ||
                user.id !== payload.request?.requestedBy.id)
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
