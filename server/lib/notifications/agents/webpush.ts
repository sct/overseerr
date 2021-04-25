import { getRepository } from 'typeorm';
import webpush from 'web-push';
import { hasNotificationType, Notification } from '..';
import { MediaType } from '../../../constants/media';
import { User } from '../../../entity/User';
import { UserPushSubscription } from '../../../entity/UserPushSubscription';
import logger from '../../../logger';
import { Permission } from '../../permissions';
import {
  getSettings,
  NotificationAgentConfig,
  NotificationAgentKey,
} from '../../settings';
import { BaseAgent, NotificationAgent, NotificationPayload } from './agent';

interface PushNotificationPayload {
  notificationType: string;
  mediaType?: 'movie' | 'tv';
  tmdbId?: number;
  subject: string;
  message?: string;
  image?: string;
  actionUrl?: string;
  requestId?: number;
}

class WebPushAgent
  extends BaseAgent<NotificationAgentConfig>
  implements NotificationAgent {
  protected getSettings(): NotificationAgentConfig {
    if (this.settings) {
      return this.settings;
    }

    const settings = getSettings();

    return settings.notifications.agents.webpush;
  }

  private getNotificationPayload(
    type: Notification,
    payload: NotificationPayload
  ): PushNotificationPayload {
    switch (type) {
      case Notification.TEST_NOTIFICATION:
        return {
          notificationType: Notification[type],
          subject: payload.subject,
          message: payload.message,
        };
      case Notification.MEDIA_APPROVED:
        return {
          notificationType: Notification[type],
          subject: payload.subject,
          message: `Your ${
            payload.media?.mediaType === MediaType.MOVIE ? 'movie' : 'series'
          } request has been approved.`,
          image: payload.image,
          mediaType: payload.media?.mediaType,
          tmdbId: payload.media?.tmdbId,
          requestId: payload.request?.id,
          actionUrl: `/${payload.media?.mediaType}/${payload.media?.tmdbId}`,
        };
      case Notification.MEDIA_AUTO_APPROVED:
        return {
          notificationType: Notification[type],
          subject: payload.subject,
          message: `Automatically approved a new ${
            payload.media?.mediaType === MediaType.MOVIE ? 'movie' : 'series'
          } request from ${payload.request?.requestedBy.displayName}.`,
          image: payload.image,
          mediaType: payload.media?.mediaType,
          tmdbId: payload.media?.tmdbId,
          requestId: payload.request?.id,
          actionUrl: `/${payload.media?.mediaType}/${payload.media?.tmdbId}`,
        };
      case Notification.MEDIA_AVAILABLE:
        return {
          notificationType: Notification[type],
          subject: payload.subject,
          message: `Your ${
            payload.media?.mediaType === MediaType.MOVIE ? 'movie' : 'series'
          } request is now available!`,
          image: payload.image,
          mediaType: payload.media?.mediaType,
          tmdbId: payload.media?.tmdbId,
          requestId: payload.request?.id,
          actionUrl: `/${payload.media?.mediaType}/${payload.media?.tmdbId}`,
        };
      case Notification.MEDIA_DECLINED:
        return {
          notificationType: Notification[type],
          subject: payload.subject,
          message: `Your ${
            payload.media?.mediaType === MediaType.MOVIE ? 'movie' : 'series'
          } request was declined.`,
          image: payload.image,
          mediaType: payload.media?.mediaType,
          tmdbId: payload.media?.tmdbId,
          requestId: payload.request?.id,
          actionUrl: `/${payload.media?.mediaType}/${payload.media?.tmdbId}`,
        };
      case Notification.MEDIA_FAILED:
        return {
          notificationType: Notification[type],
          subject: payload.subject,
          message: `Failed to process ${
            payload.media?.mediaType === MediaType.MOVIE ? 'movie' : 'series'
          } request.`,
          image: payload.image,
          mediaType: payload.media?.mediaType,
          tmdbId: payload.media?.tmdbId,
          requestId: payload.request?.id,
          actionUrl: `/${payload.media?.mediaType}/${payload.media?.tmdbId}`,
        };
      case Notification.MEDIA_PENDING:
        return {
          notificationType: Notification[type],
          subject: payload.subject,
          message: `Approval required for new ${
            payload.media?.mediaType === MediaType.MOVIE ? 'movie' : 'series'
          } request from ${payload.request?.requestedBy.displayName}.`,
          image: payload.image,
          mediaType: payload.media?.mediaType,
          tmdbId: payload.media?.tmdbId,
          requestId: payload.request?.id,
          actionUrl: `/${payload.media?.mediaType}/${payload.media?.tmdbId}`,
        };
    }
  }

  public shouldSend(type: Notification): boolean {
    if (
      this.getSettings().enabled &&
      hasNotificationType(type, this.getSettings().types)
    ) {
      return true;
    }

    return false;
  }

  public async send(
    type: Notification,
    payload: NotificationPayload
  ): Promise<boolean> {
    logger.debug('Sending web push notification', {
      label: 'Notifications',
      type: Notification[type],
      subject: payload.subject,
    });
    const userRepository = getRepository(User);
    const userPushSubRepository = getRepository(UserPushSubscription);
    const settings = getSettings();

    let pushSubs: UserPushSubscription[] = [];

    const mainUser = await userRepository.findOne({ where: { id: 1 } });

    if (
      payload.notifyUser &&
      // Check if user has webpush notifications enabled and fallback to true if undefined
      // since web push should default to true
      (payload.notifyUser.settings?.hasNotificationType(
        NotificationAgentKey.WEBPUSH,
        type
      ) ??
        true)
    ) {
      const notifySubs = await userPushSubRepository.find({
        where: { user: payload.notifyUser.id },
      });

      pushSubs = notifySubs;
    } else if (!payload.notifyUser) {
      const users = await userRepository.find();

      const manageUsers = users.filter(
        (user) =>
          user.hasPermission(Permission.MANAGE_REQUESTS) &&
          // Check if user has webpush notifications enabled and fallback to true if undefined
          // since web push should default to true
          (user.settings?.hasNotificationType(
            NotificationAgentKey.WEBPUSH,
            type
          ) ??
            true)
      );

      const allSubs = await userPushSubRepository
        .createQueryBuilder('pushSub')
        .where('pushSub.userId IN (:users)', {
          users: manageUsers.map((user) => user.id),
        })
        .getMany();

      pushSubs = allSubs;
    }

    if (mainUser && pushSubs.length > 0) {
      webpush.setVapidDetails(
        `mailto:${mainUser.email}`,
        settings.vapidPublic,
        settings.vapidPrivate
      );

      Promise.all(
        pushSubs.map(async (sub) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: {
                  auth: sub.auth,
                  p256dh: sub.p256dh,
                },
              },
              Buffer.from(
                JSON.stringify(this.getNotificationPayload(type, payload)),
                'utf-8'
              )
            );
          } catch (e) {
            // Failed to send notification so we need to remove the subscription
            userPushSubRepository.remove(sub);
          }
        })
      );
    }
    return true;
  }
}

export default WebPushAgent;
