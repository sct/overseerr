import { Notification } from '..';

export interface NotificationPayload {
  subject: string;
  username?: string;
  image?: string;
  message?: string;
}

export interface NotificationAgent {
  shouldSend(type: Notification): boolean;
  send(type: Notification, payload: NotificationPayload): Promise<boolean>;
}
