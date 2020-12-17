import type { NotificationAgent, NotificationPayload } from './agent';
import { Notification } from '..';
import path from 'path';
import { getSettings } from '../../settings';
import nodemailer from 'nodemailer';
import Email from 'email-templates';
import logger from '../../../logger';
import { getRepository } from 'typeorm';
import { User } from '../../../entity/User';
import { Permission } from '../../permissions';

class EmailAgent implements NotificationAgent {
  // TODO: Add checking for type here once we add notification type filters for agents
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public shouldSend(_type: Notification): boolean {
    const settings = getSettings();

    if (settings.notifications.agents.email.enabled) {
      return true;
    }

    return false;
  }

  private getSmtpTransport() {
    const emailSettings = getSettings().notifications.agents.email.options;

    return nodemailer.createTransport({
      host: emailSettings.smtpHost,
      port: emailSettings.smtpPort,
      secure: emailSettings.secure,
      auth:
        emailSettings.authUser && emailSettings.authPass
          ? {
              user: emailSettings.authUser,
              pass: emailSettings.authPass,
            }
          : undefined,
    });
  }

  private getNewEmail() {
    const settings = getSettings().notifications.agents.email;
    return new Email({
      message: {
        from: settings.options.emailFrom,
      },
      send: true,
      transport: this.getSmtpTransport(),
    });
  }

  private async sendMediaRequestEmail(payload: NotificationPayload) {
    const settings = getSettings().main;
    try {
      const userRepository = getRepository(User);
      const users = await userRepository.find();

      // Send to all users with the manage requests permission (or admins)
      users
        .filter((user) => user.hasPermission(Permission.MANAGE_REQUESTS))
        .forEach((user) => {
          const email = this.getNewEmail();

          email.send({
            template: path.join(
              __dirname,
              '../../../templates/email/media-request'
            ),
            message: {
              to: user.email,
            },
            locals: {
              body: 'A user has requested new media!',
              mediaName: payload.subject,
              imageUrl: payload.image,
              timestamp: new Date().toTimeString(),
              requestedBy: payload.notifyUser.username,
              actionUrl: settings.applicationUrl,
              requestType: 'New Request',
            },
          });
        });
      return true;
    } catch (e) {
      logger.error('Mail notification failed to send', {
        label: 'Notifications',
        message: e.message,
      });
      return false;
    }
  }

  private async sendMediaApprovedEmail(payload: NotificationPayload) {
    const settings = getSettings().main;
    try {
      const email = this.getNewEmail();

      email.send({
        template: path.join(
          __dirname,
          '../../../templates/email/media-request'
        ),
        message: {
          to: payload.notifyUser.email,
        },
        locals: {
          body: 'Your request for the following media has been approved:',
          mediaName: payload.subject,
          imageUrl: payload.image,
          timestamp: new Date().toTimeString(),
          requestedBy: payload.notifyUser.username,
          actionUrl: settings.applicationUrl,
          requestType: 'Request Approved',
        },
      });
      return true;
    } catch (e) {
      logger.error('Mail notification failed to send', {
        label: 'Notifications',
        message: e.message,
      });
      return false;
    }
  }

  private async sendMediaAvailableEmail(payload: NotificationPayload) {
    const settings = getSettings().main;
    try {
      const email = this.getNewEmail();

      email.send({
        template: path.join(
          __dirname,
          '../../../templates/email/media-request'
        ),
        message: {
          to: payload.notifyUser.email,
        },
        locals: {
          body: 'Your requested media is now available!',
          mediaName: payload.subject,
          imageUrl: payload.image,
          timestamp: new Date().toTimeString(),
          requestedBy: payload.notifyUser.username,
          actionUrl: settings.applicationUrl,
          requestType: 'Now Available',
        },
      });
      return true;
    } catch (e) {
      logger.error('Mail notification failed to send', {
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
      case Notification.MEDIA_AVAILABLE:
        this.sendMediaAvailableEmail(payload);
        break;
    }

    return true;
  }
}

export default EmailAgent;
