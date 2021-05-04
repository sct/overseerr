import Email from 'email-templates';
import nodemailer from 'nodemailer';
import { URL } from 'url';
import { getSettings, NotificationAgentEmail } from '../settings';
import { openpgpEncrypt } from './openpgpEncrypt';

class PreparedEmail extends Email {
  public constructor(settings: NotificationAgentEmail, pgpKey?: string) {
    const { applicationUrl } = getSettings().main;

    const transport = nodemailer.createTransport({
      name: applicationUrl ? new URL(applicationUrl).hostname : undefined,
      host: settings.options.smtpHost,
      port: settings.options.smtpPort,
      secure: settings.options.secure,
      ignoreTLS: settings.options.ignoreTls,
      requireTLS: settings.options.requireTls,
      tls: settings.options.allowSelfSigned
        ? {
            rejectUnauthorized: false,
          }
        : undefined,
      auth:
        settings.options.authUser && settings.options.authPass
          ? {
              user: settings.options.authUser,
              pass: settings.options.authPass,
            }
          : undefined,
    });

    if (pgpKey) {
      transport.use(
        'stream',
        openpgpEncrypt({
          signingKey: settings.options.pgpPrivateKey,
          password: settings.options.pgpPassword,
          encryptionKeys: [pgpKey],
        })
      );
    }

    super({
      message: {
        from: {
          name: settings.options.senderName,
          address: settings.options.emailFrom,
        },
      },
      send: true,
      transport: transport,
    });
  }
}

export default PreparedEmail;
