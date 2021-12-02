import { EmailOptions } from 'email-templates';
import path from 'path';
import { getRepository } from 'typeorm';
import { Notification, shouldSendAdminNotification } from '..';
import { IssueType, IssueTypeName } from '../../../constants/issue';
import { MediaType } from '../../../constants/media';
import { User } from '../../../entity/User';
import logger from '../../../logger';
import PreparedEmail from '../../email';
import {
  getSettings,
  NotificationAgentEmail,
  NotificationAgentKey,
} from '../../settings';
import { BaseAgent, NotificationAgent, NotificationPayload } from './agent';

class EmailAgent
  extends BaseAgent<NotificationAgentEmail>
  implements NotificationAgent
{
  protected getSettings(): NotificationAgentEmail {
    if (this.settings) {
      return this.settings;
    }

    const settings = getSettings();

    return settings.notifications.agents.email;
  }

  public shouldSend(): boolean {
    const settings = this.getSettings();

    if (
      settings.enabled &&
      settings.options.emailFrom &&
      settings.options.smtpHost &&
      settings.options.smtpPort
    ) {
      return true;
    }

    return false;
  }

  private buildMessage(
    type: Notification,
    payload: NotificationPayload,
    recipientEmail: string,
    recipientName?: string
  ): EmailOptions | undefined {
    const { applicationUrl, applicationTitle } = getSettings().main;

    if (type === Notification.TEST_NOTIFICATION) {
      return {
        template: path.join(__dirname, '../../../templates/email/test-email'),
        message: {
          to: recipientEmail,
        },
        locals: {
          body: payload.message,
          applicationUrl,
          applicationTitle,
          recipientName,
          recipientEmail,
        },
      };
    }

    const media =
      payload.request?.media ??
      payload.issue?.media ??
      payload.comment?.issue?.media;
    const mediaType = media
      ? media.mediaType === MediaType.MOVIE
        ? 'movie'
        : 'series'
      : undefined;

    if (payload.request) {
      let body = '';

      switch (type) {
        case Notification.MEDIA_PENDING:
          body = `A new request for the following ${mediaType} is pending approval:`;
          break;
        case Notification.MEDIA_APPROVED:
          body = `Your request for the following ${mediaType} has been approved:`;
          break;
        case Notification.MEDIA_AUTO_APPROVED:
          body = `A new request for the following ${mediaType} has been automatically approved:`;
          break;
        case Notification.MEDIA_AVAILABLE:
          body = `Your request for the following ${mediaType} is now available:`;
          break;
        case Notification.MEDIA_DECLINED:
          body = `Your request for the following ${mediaType} was declined:`;
          break;
        case Notification.MEDIA_FAILED:
          body = `A request for the following ${mediaType} failed to be added to ${
            media?.mediaType === MediaType.MOVIE ? 'Radarr' : 'Sonarr'
          }:`;
          break;
      }

      return {
        template: path.join(
          __dirname,
          '../../../templates/email/media-request'
        ),
        message: {
          to: recipientEmail,
        },
        locals: {
          event: payload.event,
          body,
          mediaName: payload.subject,
          mediaExtra: payload.extra ?? [],
          imageUrl: payload.image,
          timestamp: new Date().toTimeString(),
          requestedBy: payload.request.requestedBy.displayName,
          actionUrl: applicationUrl
            ? `${applicationUrl}/${media?.mediaType}/${media?.tmdbId}`
            : undefined,
          applicationUrl,
          applicationTitle,
          recipientName,
          recipientEmail,
        },
      };
    } else if (payload.issue || payload.comment) {
      const issue = payload.issue ?? payload.comment?.issue;
      const issueType =
        issue && issue.issueType !== IssueType.OTHER
          ? `${IssueTypeName[issue.issueType].toLowerCase()} issue`
          : 'issue';

      let body = '';

      switch (type) {
        case Notification.ISSUE_CREATED:
          body = `A new ${issueType} has been reported by ${issue?.createdBy.displayName} for the ${mediaType} ${payload.subject}:`;
          break;
        case Notification.ISSUE_COMMENT:
          body = `${payload.comment?.user.displayName} commented on the ${issueType} for the ${mediaType} ${payload.subject}:`;
          break;
        case Notification.ISSUE_RESOLVED:
          body = `The ${issueType} for the ${mediaType} ${payload.subject} was marked as resolved by ${payload.issue?.modifiedBy?.displayName}!`;
          break;
        case Notification.ISSUE_REOPENED:
          body = `The ${issueType} for the ${mediaType} ${payload.subject} was reopened by ${payload.issue?.modifiedBy?.displayName}.`;
          break;
      }

      return {
        template: path.join(__dirname, '../../../templates/email/media-issue'),
        message: {
          to: recipientEmail,
        },
        locals: {
          event: payload.event,
          body,
          issueDescription: payload.message,
          issueComment: payload.comment?.message,
          mediaName: payload.subject,
          extra: payload.extra ?? [],
          imageUrl: payload.image,
          timestamp: new Date().toTimeString(),
          reportedBy: issue?.createdBy.displayName,
          actionUrl: applicationUrl
            ? `${applicationUrl}/issue/${issue?.id}`
            : undefined,
          applicationUrl,
          applicationTitle,
          recipientName,
          recipientEmail,
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
      // Send notification to the target user
      if (
        !payload.notifyUser.settings ||
        // Check if user has email notifications enabled and fallback to true if undefined
        // since email should default to true
        (payload.notifyUser.settings.hasNotificationType(
          NotificationAgentKey.EMAIL,
          type
        ) ??
          true)
      ) {
        logger.debug('Sending email notification', {
          label: 'Notifications',
          recipient: payload.notifyUser.displayName,
          type: Notification[type],
          subject: payload.subject,
        });

        try {
          const email = new PreparedEmail(
            this.getSettings(),
            payload.notifyUser.settings?.pgpKey
          );
          await email.send(
            this.buildMessage(
              type,
              payload,
              payload.notifyUser.email,
              payload.notifyUser.displayName
            )
          );
        } catch (e) {
          logger.error('Error sending email notification', {
            label: 'Notifications',
            recipient: payload.notifyUser.displayName,
            type: Notification[type],
            subject: payload.subject,
            errorMessage: e.message,
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
              (!user.settings ||
                // Check if user has email notifications enabled and fallback to true if undefined
                // since email should default to true
                (user.settings.hasNotificationType(
                  NotificationAgentKey.EMAIL,
                  type
                ) ??
                  true)) &&
              shouldSendAdminNotification(type, user, payload)
          )
          .map(async (user) => {
            logger.debug('Sending email notification', {
              label: 'Notifications',
              recipient: user.displayName,
              type: Notification[type],
              subject: payload.subject,
            });

            try {
              const email = new PreparedEmail(
                this.getSettings(),
                user.settings?.pgpKey
              );
              await email.send(
                this.buildMessage(type, payload, user.email, user.displayName)
              );
            } catch (e) {
              logger.error('Error sending email notification', {
                label: 'Notifications',
                recipient: user.displayName,
                type: Notification[type],
                subject: payload.subject,
                errorMessage: e.message,
              });

              return false;
            }
          })
      );
    }

    return true;
  }
}

export default EmailAgent;
