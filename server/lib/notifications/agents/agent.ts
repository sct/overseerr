import type { Notification } from '..';
import type Issue from '../../../entity/Issue';
import type IssueComment from '../../../entity/IssueComment';
import type Media from '../../../entity/Media';
import type { MediaRequest } from '../../../entity/MediaRequest';
import type { User } from '../../../entity/User';
import type { NotificationAgentConfig } from '../../settings';

export interface NotificationPayload {
  event?: string;
  subject: string;
  notifyAdmin: boolean;
  notifyUser?: User;
  media?: Media;
  image?: string;
  message?: string;
  extra?: { name: string; value: string }[];
  request?: MediaRequest;
  issue?: Issue;
  comment?: IssueComment;
}

export abstract class BaseAgent<T extends NotificationAgentConfig> {
  protected settings?: T;
  public constructor(settings?: T) {
    this.settings = settings;
  }

  protected abstract getSettings(): T;
}

export interface NotificationAgent {
  shouldSend(): boolean;
  send(type: Notification, payload: NotificationPayload): Promise<boolean>;
}
