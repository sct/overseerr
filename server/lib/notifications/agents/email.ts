import type { NotificationAgent, NotificationPayload } from './agent';
import { Notification } from '..';
import path from 'path';
import { getSettings } from '../../settings';
import nodemailer from 'nodemailer';
import Email from 'email-templates';
import logger from '../../../logger';
import { getRepository } from 'typeorm';
import { User } from '../../../entity/User';
import { hasPermission, Permission } from '../../permissions';

class EmailAgent implements NotificationAgent {
  public shouldSend(type: Notification): boolean {
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
      auth: {
        user: emailSettings.authUser,
        pass: emailSettings.authPass,
      },
    });
  }

  private getNewEmail() {
    return new Email({
      message: {
        from: 'no-reply@os.sct.dev',
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
          logger.debug('Sending email notification', {
            label: 'Notifications',
          });

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

  public async send(
    type: Notification,
    payload: NotificationPayload
  ): Promise<boolean> {
    logger.debug('Sending email notification', { label: 'Notifications' });

    switch (type) {
      case Notification.MEDIA_PENDING:
        this.sendMediaRequestEmail(payload);
        break;
    }

    return true;
  }
}

export default EmailAgent;
