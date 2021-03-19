import path from 'path';
import { getRepository } from 'typeorm';
import { hasNotificationType, Notification } from '..';
import { MediaType } from '../../../constants/media';
import { User } from '../../../entity/User';
import logger from '../../../logger';
import PreparedEmail from '../../email';
import { Permission } from '../../permissions';
import { getSettings, NotificationAgentEmail } from '../../settings';
import { BaseAgent, NotificationAgent, NotificationPayload } from './agent';

class EmailAgent
  extends BaseAgent<NotificationAgentEmail>
  implements NotificationAgent {
  protected getSettings(): NotificationAgentEmail {
    if (this.settings) {
      return this.settings;
    }

    const settings = getSettings();

    return settings.notifications.agents.email;
  }

  public shouldSend(type: Notification): boolean {
    const settings = this.getSettings();

    if (
      settings.enabled &&
      hasNotificationType(type, this.getSettings().types)
    ) {
      return true;
    }

    return false;
  }

  private async sendMediaRequestEmail(payload: NotificationPayload) {
    // This is getting main settings for the whole app
    const { applicationUrl, applicationTitle } = getSettings().main;
    try {
      const userRepository = getRepository(User);
      const users = await userRepository.find();

      // Send to all users with the manage requests permission (or admins)
      users
        .filter(
          (user) =>
            user.hasPermission(Permission.MANAGE_REQUESTS) &&
            (user.settings?.enableEmail ?? true)
        )
        .forEach((user) => {
          const email = new PreparedEmail(user.settings?.pgpKey);

          email.send({
            template: path.join(
              __dirname,
              '../../../templates/email/media-request'
            ),
            message: {
              to: user.email,
            },
            locals: {
              body: `A user has requested a new ${
                payload.media?.mediaType === MediaType.TV ? 'series' : 'movie'
              }!`,
              mediaName: payload.subject,
              mediaPlot: payload.message,
              mediaExtra: payload.extra ?? [],
              imageUrl: payload.image,
              timestamp: new Date().toTimeString(),
              requestedBy: payload.request?.requestedBy.displayName,
              actionUrl: applicationUrl
                ? `${applicationUrl}/${payload.media?.mediaType}/${payload.media?.tmdbId}`
                : undefined,
              applicationUrl,
              applicationTitle,
              requestType: `New ${
                payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
              } Request`,
            },
          });
        });
      return true;
    } catch (e) {
      logger.error('Email notification failed to send', {
        label: 'Notifications',
        message: e.message,
      });
      return false;
    }
  }

  private async sendMediaFailedEmail(payload: NotificationPayload) {
    // This is getting main settings for the whole app
    const { applicationUrl, applicationTitle } = getSettings().main;
    try {
      const userRepository = getRepository(User);
      const users = await userRepository.find();

      // Send to all users with the manage requests permission (or admins)
      users
        .filter(
          (user) =>
            user.hasPermission(Permission.MANAGE_REQUESTS) &&
            (user.settings?.enableEmail ?? true)
        )
        .forEach((user) => {
          const email = new PreparedEmail(user.settings?.pgpKey);

          email.send({
            template: path.join(
              __dirname,
              '../../../templates/email/media-request'
            ),
            message: {
              to: user.email,
            },
            locals: {
              body: `A new request for the following ${
                payload.media?.mediaType === MediaType.TV ? 'series' : 'movie'
              } could not be added to ${
                payload.media?.mediaType === MediaType.TV ? 'Sonarr' : 'Radarr'
              }:`,
              mediaName: payload.subject,
              mediaPlot: payload.message,
              imageUrl: payload.image,
              timestamp: new Date().toTimeString(),
              requestedBy: payload.request?.requestedBy.displayName,
              actionUrl: applicationUrl
                ? `${applicationUrl}/${payload.media?.mediaType}/${payload.media?.tmdbId}`
                : undefined,
              applicationUrl,
              applicationTitle,
              requestType: `Failed ${
                payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
              } Request`,
            },
          });
        });
      return true;
    } catch (e) {
      logger.error('Email notification failed to send', {
        label: 'Notifications',
        message: e.message,
      });
      return false;
    }
  }

  private async sendMediaApprovedEmail(payload: NotificationPayload) {
    // This is getting main settings for the whole app
    const { applicationUrl, applicationTitle } = getSettings().main;
    try {
      if (
        payload.notifyUser &&
        (payload.notifyUser.settings?.enableEmail ?? true)
      ) {
        const email = new PreparedEmail(payload.notifyUser.settings?.pgpKey);

        await email.send({
          template: path.join(
            __dirname,
            '../../../templates/email/media-request'
          ),
          message: {
            to: payload.notifyUser.email,
          },
          locals: {
            body: `Your request for the following ${
              payload.media?.mediaType === MediaType.TV ? 'series' : 'movie'
            } has been approved:`,
            mediaName: payload.subject,
            mediaExtra: payload.extra ?? [],
            imageUrl: payload.image,
            timestamp: new Date().toTimeString(),
            requestedBy: payload.request?.requestedBy.displayName,
            actionUrl: applicationUrl
              ? `${applicationUrl}/${payload.media?.mediaType}/${payload.media?.tmdbId}`
              : undefined,
            applicationUrl,
            applicationTitle,
            requestType: `${
              payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
            } Request Approved`,
          },
        });
      }

      return true;
    } catch (e) {
      logger.error('Email notification failed to send', {
        label: 'Notifications',
        message: e.message,
      });
      return false;
    }
  }

  private async sendMediaAutoApprovedEmail(payload: NotificationPayload) {
    // This is getting main settings for the whole app
    const { applicationUrl, applicationTitle } = getSettings().main;
    try {
      const userRepository = getRepository(User);
      const users = await userRepository.find();

      // Send to all users with the manage requests permission (or admins)
      users
        .filter(
          (user) =>
            user.hasPermission(Permission.MANAGE_REQUESTS) &&
            (user.settings?.enableEmail ?? true)
        )
        .forEach((user) => {
          const email = new PreparedEmail();

          email.send({
            template: path.join(
              __dirname,
              '../../../templates/email/media-request'
            ),
            message: {
              to: user.email,
            },
            locals: {
              body: `A new request for the following ${
                payload.media?.mediaType === MediaType.TV ? 'series' : 'movie'
              } has been automatically approved:`,
              mediaName: payload.subject,
              mediaExtra: payload.extra ?? [],
              imageUrl: payload.image,
              timestamp: new Date().toTimeString(),
              requestedBy: payload.request?.requestedBy.displayName,
              actionUrl: applicationUrl
                ? `${applicationUrl}/${payload.media?.mediaType}/${payload.media?.tmdbId}`
                : undefined,
              applicationUrl,
              applicationTitle,
              requestType: `${
                payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
              } Request Automatically Approved`,
            },
          });
        });
      return true;
    } catch (e) {
      logger.error('Email notification failed to send', {
        label: 'Notifications',
        message: e.message,
      });
      return false;
    }
  }

  private async sendMediaDeclinedEmail(payload: NotificationPayload) {
    // This is getting main settings for the whole app
    const { applicationUrl, applicationTitle } = getSettings().main;
    try {
      if (
        payload.notifyUser &&
        (payload.notifyUser.settings?.enableEmail ?? true)
      ) {
        const email = new PreparedEmail(payload.notifyUser.settings?.pgpKey);

        await email.send({
          template: path.join(
            __dirname,
            '../../../templates/email/media-request'
          ),
          message: {
            to: payload.notifyUser.email,
          },
          locals: {
            body: `Your request for the following ${
              payload.media?.mediaType === MediaType.TV ? 'series' : 'movie'
            } was declined:`,
            mediaName: payload.subject,
            mediaExtra: payload.extra ?? [],
            imageUrl: payload.image,
            timestamp: new Date().toTimeString(),
            requestedBy: payload.request?.requestedBy.displayName,
            actionUrl: applicationUrl
              ? `${applicationUrl}/${payload.media?.mediaType}/${payload.media?.tmdbId}`
              : undefined,
            applicationUrl,
            applicationTitle,
            requestType: `${
              payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
            } Request Declined`,
          },
        });
      }

      return true;
    } catch (e) {
      logger.error('Email notification failed to send', {
        label: 'Notifications',
        message: e.message,
      });
      return false;
    }
  }

  private async sendMediaAvailableEmail(payload: NotificationPayload) {
    // This is getting main settings for the whole app
    const { applicationUrl, applicationTitle } = getSettings().main;
    try {
      if (
        payload.notifyUser &&
        (payload.notifyUser.settings?.enableEmail ?? true)
      ) {
        const email = new PreparedEmail(payload.notifyUser.settings?.pgpKey);

        await email.send({
          template: path.join(
            __dirname,
            '../../../templates/email/media-request'
          ),
          message: {
            to: payload.notifyUser.email,
          },
          locals: {
            body: `The following ${
              payload.media?.mediaType === MediaType.TV ? 'series' : 'movie'
            } you requested is now available!`,
            mediaName: payload.subject,
            mediaExtra: payload.extra ?? [],
            imageUrl: payload.image,
            timestamp: new Date().toTimeString(),
            requestedBy: payload.request?.requestedBy.displayName,
            actionUrl: applicationUrl
              ? `${applicationUrl}/${payload.media?.mediaType}/${payload.media?.tmdbId}`
              : undefined,
            applicationUrl,
            applicationTitle,
            requestType: `${
              payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
            } Now Available`,
          },
        });
      }

      return true;
    } catch (e) {
      logger.error('Email notification failed to send', {
        label: 'Notifications',
        message: e.message,
      });
      return false;
    }
  }

  private async sendTestEmail(payload: NotificationPayload) {
    // This is getting main settings for the whole app
    const { applicationUrl, applicationTitle } = getSettings().main;
    try {
      if (payload.notifyUser) {
        const email = new PreparedEmail(payload.notifyUser.settings?.pgpKey);

        await email.send({
          template: path.join(__dirname, '../../../templates/email/test-email'),
          message: {
            to: payload.notifyUser.email,
          },
          locals: {
            body: payload.message,
            applicationUrl,
            applicationTitle,
          },
        });
      }

      return true;
    } catch (e) {
      logger.error('Email notification failed to send', {
        label: 'Notifications',
        message: e.message,
      });
      return false;
    }
  }

  public async send(
    type: Notification,
    payload: NotificationPayload
  ): Promise<boolean> {
    logger.debug('Sending email notification', { label: 'Notifications' });

    switch (type) {
      case Notification.MEDIA_PENDING:
        this.sendMediaRequestEmail(payload);
        break;
      case Notification.MEDIA_APPROVED:
        this.sendMediaApprovedEmail(payload);
        break;
      case Notification.MEDIA_AUTO_APPROVED:
        this.sendMediaAutoApprovedEmail(payload);
        break;
      case Notification.MEDIA_DECLINED:
        this.sendMediaDeclinedEmail(payload);
        break;
      case Notification.MEDIA_AVAILABLE:
        this.sendMediaAvailableEmail(payload);
        break;
      case Notification.MEDIA_FAILED:
        this.sendMediaFailedEmail(payload);
        break;
      case Notification.TEST_NOTIFICATION:
        this.sendTestEmail(payload);
        break;
    }

    return true;
  }
}

export default EmailAgent;
