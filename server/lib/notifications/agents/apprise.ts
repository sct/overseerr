import { IssueStatus, IssueTypeName } from '@server/constants/issue';
import type { NotificationAgentApprise } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import axios from 'axios';
import { hasNotificationType, Notification } from '..';
import type { NotificationAgent, NotificationPayload } from './agent';
import { BaseAgent } from './agent';

interface ApprisePayload {
  title: string;
  body: string;
  type: string;
}

class AppriseAgent
  extends BaseAgent<NotificationAgentApprise>
  implements NotificationAgent
{
  protected getSettings(): NotificationAgentApprise {
    if (this.settings) {
      return this.settings;
    }

    const settings = getSettings();

    return settings.notifications.agents.apprise;
  }

  public shouldSend(): boolean {
    const settings = this.getSettings();

    if (settings.enabled && settings.options.url) {
      return true;
    }

    return false;
  }

  private getNotificationPayload(
    type: Notification,
    payload: NotificationPayload
  ): ApprisePayload {
    const { applicationUrl, applicationTitle } = getSettings().main;
    let notificationType = 'info';

    const title = payload.event
      ? `${payload.event} - ${payload.subject}`
      : payload.subject;
    let body = payload.message ?? '';

    if (payload.request) {
      body += `\n\nRequested By: ${payload.request.requestedBy.displayName}`;

      let status = '';
      switch (type) {
        case Notification.MEDIA_PENDING:
          status = 'Pending Approval';
          break;
        case Notification.MEDIA_APPROVED:
        case Notification.MEDIA_AUTO_APPROVED:
          status = 'Processing';
          break;
        case Notification.MEDIA_AVAILABLE:
          status = 'Available';
          break;
        case Notification.MEDIA_DECLINED:
          status = 'Declined';
          break;
        case Notification.MEDIA_FAILED:
          status = 'Failed';
          break;
      }

      if (status) {
        body += `\nRequest Status: ${status}`;
      }
    } else if (payload.comment) {
      body += `\nComment from ${payload.comment.user.displayName}:\n${payload.comment.message}`;
    } else if (payload.issue) {
      body += `\n\nReported By: ${payload.issue.createdBy.displayName}`;
      body += `\nIssue Type: ${IssueTypeName[payload.issue.issueType]}`;
      body += `\nIssue Status: ${
        payload.issue.status === IssueStatus.OPEN ? 'Open' : 'Resolved'
      }`;

      if (type == Notification.ISSUE_CREATED) {
        notificationType = 'failure';
      }
    }

    for (const extra of payload.extra ?? []) {
      body += `\n\n**${extra.name}**\n${extra.value}`;
    }

    if (applicationUrl && payload.media) {
      const actionUrl = `${applicationUrl}/${payload.media.mediaType}/${payload.media.tmdbId}`;
      body += `\n\nOpen in ${applicationTitle}(${actionUrl})`;
    }

    return {
      title,
      body,
      type: notificationType,
    };
  }

  public async send(
    type: Notification,
    payload: NotificationPayload
  ): Promise<boolean> {
    const settings = this.getSettings();

    if (
      !payload.notifySystem ||
      !hasNotificationType(type, settings.types ?? 0)
    ) {
      return true;
    }

    logger.debug('Sending Apprise notification', {
      label: 'Notifications',
      type: Notification[type],
      subject: payload.subject,
    });
    try {
      const endpoint = `${settings.options.url}`;
      const notificationPayload = this.getNotificationPayload(type, payload);

      await axios.post(endpoint, notificationPayload);

      return true;
    } catch (e) {
      logger.error('Error sending Apprise notification', {
        label: 'Notifications',
        type: Notification[type],
        subject: payload.subject,
        errorMessage: e.message,
        response: e.response?.data,
      });

      return false;
    }
  }
}

export default AppriseAgent;
