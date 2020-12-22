import logger from '../../logger';
import type { NotificationAgent, NotificationPayload } from './agents/agent';

export enum Notification {
  MEDIA_PENDING = 2,
  MEDIA_APPROVED = 4,
  MEDIA_AVAILABLE = 8,
  TEST_NOTIFICATION = 16,
}

class NotificationManager {
  private activeAgents: NotificationAgent[] = [];

  public registerAgents = (agents: NotificationAgent[]): void => {
    this.activeAgents = [...this.activeAgents, ...agents];
    logger.info('Registered Notification Agents', { label: 'Notifications' });
  };

  public sendNotification(
    type: Notification,
    payload: NotificationPayload
  ): void {
    logger.info(`Sending notification for ${Notification[type]}`, {
      label: 'Notifications',
    });
    this.activeAgents.forEach((agent) => {
      if (agent.shouldSend(type)) {
        agent.send(type, payload);
      }
    });
  }
}

const notificationManager = new NotificationManager();

export default notificationManager;
