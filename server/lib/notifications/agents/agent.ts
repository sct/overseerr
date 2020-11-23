import { Notification } from '..';
import { User } from '../../../entity/User';

export interface NotificationPayload {
  subject: string;
  notifyUser: User;
  image?: string;
  message?: string;
  extra?: { name: string; value: string }[];
}

export interface NotificationAgent {
  shouldSend(type: Notification): boolean;
  send(type: Notification, payload: NotificationPayload): Promise<boolean>;
}
