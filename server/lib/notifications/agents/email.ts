import { EmailOptions } from 'email-templates';
import path from 'path';
import { getRepository } from 'typeorm';
import { hasNotificationType, Notification } from '..';
import { MediaType } from '../../../constants/media';
import { User } from '../../../entity/User';
import logger from '../../../logger';
import PreparedEmail from '../../email';
import { Permission } from '../../permissions';
import { getSettings, NotificationAgentEmail } from '../../settings';
import { NotificationAgentType } from '../agenttypes';
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

  private buildMessage(
    type: Notification,
    payload: NotificationPayload,
    toEmail: string
  ): EmailOptions | undefined {
    const { applicationUrl, applicationTitle } = getSettings().main;

    if (type === Notification.TEST_NOTIFICATION) {
      return {
        template: path.join(__dirname, '../../../templates/email/test-email'),
        message: {
          to: toEmail,
        },
        locals: {
          body: payload.message,
          applicationUrl,
          applicationTitle,
        },
      };
    }

    if (payload.media) {
      let requestType = '';
      let body = '';

      switch (type) {
        case Notification.MEDIA_PENDING:
          requestType = `New ${
            payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
          } Request`;
          body = `A user has requested a new ${
            payload.media?.mediaType === MediaType.TV ? 'series' : 'movie'
          }!`;
          break;
        case Notification.MEDIA_APPROVED:
          requestType = `${
            payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
          } Request Approved`;
          body = `Your request for the following ${
            payload.media?.mediaType === MediaType.TV ? 'series' : 'movie'
          } has been approved:`;
          break;
        case Notification.MEDIA_AUTO_APPROVED:
          requestType = `${
            payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
          } Request Automatically Approved`;
          body = `A new request for the following ${
            payload.media?.mediaType === MediaType.TV ? 'series' : 'movie'
          } has been automatically approved:`;
          break;
        case Notification.MEDIA_AVAILABLE:
          requestType = `${
            payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
          } Now Available`;
          body = `The following ${
            payload.media?.mediaType === MediaType.TV ? 'series' : 'movie'
          } you requested is now available!`;
          break;
        case Notification.MEDIA_DECLINED:
          requestType = `${
            payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
          } Request Declined`;
          body = `Your request for the following ${
            payload.media?.mediaType === MediaType.TV ? 'series' : 'movie'
          } was declined:`;
          break;
        case Notification.MEDIA_FAILED:
          requestType = `Failed ${
            payload.media?.mediaType === MediaType.TV ? 'Series' : 'Movie'
          } Request`;
          body = `A new request for the following ${
            payload.media?.mediaType === MediaType.TV ? 'series' : 'movie'
          } could not be added to ${
            payload.media?.mediaType === MediaType.TV ? 'Sonarr' : 'Radarr'
          }:`;
          break;
      }

      return {
        template: path.join(
          __dirname,
          '../../../templates/email/media-request'
        ),
        message: {
          to: toEmail,
        },
        locals: {
          requestType,
          body,
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
        },
      };
    }

    return undefined;
  }

  public async send(
    type: Notification,
    payload: NotificationPayload
  ): Promise<boolean> {
    if (payload.notifyUser) {
      // Send notification to the user who submitted the request
      if (
        payload.notifyUser.settings?.hasNotificationAgentEnabled(
          NotificationAgentType.EMAIL
        )
      ) {
        logger.debug('Sending email notification', {
          label: 'Notifications',
          recipient: payload.notifyUser.displayName,
          type: type,
          subject: payload.subject,
        });

        try {
          const email = new PreparedEmail(payload.notifyUser.settings?.pgpKey);
          await email.send(
            this.buildMessage(type, payload, payload.notifyUser.email)
          );
        } catch (e) {
          logger.error('Email notification failed to send', {
            label: 'Notifications',
            recipient: payload.notifyUser.displayName,
            type: type,
            subject: payload.subject,
            errorMessage: e.message,
          });

          return false;
        }
      }
    } else {
      // Send notifications to all users with the Manage Requests permission
      const userRepository = getRepository(User);
      const users = await userRepository.find();

      users
        .filter(
          (user) =>
            user.hasPermission(Permission.MANAGE_REQUESTS) &&
            user.settings?.hasNotificationAgentEnabled(
              NotificationAgentType.EMAIL
            )
        )
        .forEach((user) => {
          logger.debug('Sending email notification', {
            label: 'Notifications',
            recipient: user.displayName,
            type: type,
            subject: payload.subject,
          });

          try {
            const email = new PreparedEmail(user.settings?.pgpKey);
            email.send(this.buildMessage(type, payload, user.email));
          } catch (e) {
            logger.error('Email notification failed to send', {
              label: 'Notifications',
              recipient: user.displayName,
              type: type,
              subject: payload.subject,
              errorMessage: e.message,
            });

            return false;
          }
        });
    }

    return true;
  }
}

export default EmailAgent;
