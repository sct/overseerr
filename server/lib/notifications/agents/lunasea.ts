import axios from 'axios';
import { hasNotificationType, Notification } from '..';
import { IssueStatus, IssueType } from '../../../constants/issue';
import { MediaStatus } from '../../../constants/media';
import logger from '../../../logger';
import { getSettings, NotificationAgentLunaSea } from '../../settings';
import { BaseAgent, NotificationAgent, NotificationPayload } from './agent';

class LunaSeaAgent
  extends BaseAgent<NotificationAgentLunaSea>
  implements NotificationAgent
{
  protected getSettings(): NotificationAgentLunaSea {
    if (this.settings) {
      return this.settings;
    }

    const settings = getSettings();

    return settings.notifications.agents.lunasea;
  }

  private buildPayload(type: Notification, payload: NotificationPayload) {
    const media =
      payload.request?.media ??
      payload.issue?.media ??
      payload.comment?.issue?.media;
    const issue = payload.issue ?? payload.comment?.issue;

    return {
      notification_type: Notification[type],
      event: payload.event,
      subject: payload.subject,
      message: payload.message,
      image: payload.image ?? null,
      email: payload.notifyUser?.email,
      username: payload.notifyUser?.displayName,
      avatar: payload.notifyUser?.avatar,
      media: media
        ? {
            media_type: media.mediaType,
            tmdbId: media.tmdbId,
            tvdbId: media.tvdbId,
            status: MediaStatus[media.status],
            status4k: MediaStatus[media.status4k],
          }
        : null,
      extra: payload.extra ?? [],
      request: payload.request
        ? {
            request_id: payload.request.id,
            requestedBy_email: payload.request.requestedBy.email,
            requestedBy_username: payload.request.requestedBy.displayName,
            requestedBy_avatar: payload.request.requestedBy.avatar,
          }
        : null,
      issue: issue
        ? {
            issue_id: issue.id,
            issue_type: IssueType[issue.issueType],
            issue_status: IssueStatus[issue.status],
            createdBy_email: issue.createdBy.email,
            createdBy_username: issue.createdBy.displayName,
            createdBy_avatar: issue.createdBy.avatar,
          }
        : null,
      comment: payload.comment
        ? {
            comment_id: payload.comment.id,
            commentedBy_email: payload.comment.user.email,
            commentedBy_username: payload.comment.user.displayName,
            commentedBy_avatar: payload.comment.user.avatar,
          }
        : null,
    };
  }

  public shouldSend(): boolean {
    const settings = this.getSettings();

    if (settings.enabled && settings.options.webhookUrl) {
      return true;
    }

    return false;
  }

  public async send(
    type: Notification,
    payload: NotificationPayload
  ): Promise<boolean> {
    const settings = this.getSettings();

    if (!hasNotificationType(type, settings.types ?? 0)) {
      return true;
    }

    logger.debug('Sending LunaSea notification', {
      label: 'Notifications',
      type: Notification[type],
      subject: payload.subject,
    });

    try {
      await axios.post(
        settings.options.webhookUrl,
        this.buildPayload(type, payload),
        settings.options.profileName
          ? {
              headers: {
                Authorization: `Basic ${Buffer.from(
                  `${settings.options.profileName}:`
                ).toString('base64')}`,
              },
            }
          : undefined
      );

      return true;
    } catch (e) {
      logger.error('Error sending LunaSea notification', {
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

export default LunaSeaAgent;
