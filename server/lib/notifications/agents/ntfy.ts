import { IssueStatus, IssueTypeName } from '@server/constants/issue';
import type { NotificationAgentNtfy } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import axios from 'axios';
import { hasNotificationType, Notification } from '..';
import type { NotificationAgent, NotificationPayload } from './agent';
import { BaseAgent } from './agent';

interface NtfyPayload {
  topic: string;
  title: string;
  message: string;
  priority: number;
  icon?: string;
  actions?: {
    action: 'view';
    clear: true;
    url: string;
    label: string;
  }[];
}

class NtfyAgent
  extends BaseAgent<NotificationAgentNtfy>
  implements NotificationAgent
{
  protected getSettings(): NotificationAgentNtfy {
    if (this.settings) {
      return this.settings;
    }

    const settings = getSettings();

    return settings.notifications.agents.ntfy;
  }

  public shouldSend(): boolean {
    const settings = this.getSettings();

    if (settings.enabled && settings.options.url && settings.options.topic) {
      return true;
    }

    return false;
  }

  private getNotificationPayload(
    type: Notification,
    payload: NotificationPayload
  ): NtfyPayload {
    const { applicationUrl, applicationTitle } = getSettings().main;
    const settings = this.getSettings();
    let priority = 0;

    const title = payload.event
      ? `${payload.event} - ${payload.subject}`
      : payload.subject;
    let message = payload.message ?? '';

    if (payload.request) {
      message += `\n\nRequested By: ${payload.request.requestedBy.displayName}`;

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
        message += `\nRequest Status: ${status}`;
      }
    } else if (payload.comment) {
      message += `\nComment from ${payload.comment.user.displayName}:\n${payload.comment.message}`;
    } else if (payload.issue) {
      message += `\n\nReported By: ${payload.issue.createdBy.displayName}`;
      message += `\nIssue Type: ${IssueTypeName[payload.issue.issueType]}`;
      message += `\nIssue Status: ${
        payload.issue.status === IssueStatus.OPEN ? 'Open' : 'Resolved'
      }`;

      if (type == Notification.ISSUE_CREATED) {
        priority = 1;
      }
    }

    for (const extra of payload.extra ?? []) {
      message += `\n\n**${extra.name}**\n${extra.value}`;
    }

    const res: NtfyPayload = {
      topic: settings.options.topic,
      title,
      message,
      priority,
      icon: payload.image,
    };

    if (applicationUrl && payload.media) {
      res.actions = [
        {
          action: 'view',
          clear: true,
          url: `${applicationUrl}/${payload.media.mediaType}/${payload.media.tmdbId}`,
          label: `Open ${applicationTitle}`,
        },
      ];
    }

    return res;
  }

  public async send(
    type: Notification,
    payload: NotificationPayload
  ): Promise<boolean> {
    const {
      options: { url },
      types,
    } = this.getSettings();

    if (!payload.notifySystem || !hasNotificationType(type, types ?? 0)) {
      return true;
    }

    logger.debug('Sending ntfy notification', {
      label: 'Notifications',
      type: Notification[type],
      subject: payload.subject,
    });
    try {
      const notificationPayload = this.getNotificationPayload(type, payload);

      await axios.post(url, notificationPayload, {
        headers: {
          'Content-Type': 'text/markdown',
        },
      });

      return true;
    } catch (e) {
      logger.error('Error sending ntfy notification', {
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

export default NtfyAgent;
