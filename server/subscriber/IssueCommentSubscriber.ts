import { sortBy } from 'lodash';
import {
  EntitySubscriberInterface,
  EventSubscriber,
  getRepository,
  InsertEvent,
} from 'typeorm';
import TheMovieDb from '../api/themoviedb';
import { IssueType, IssueTypeName } from '../constants/issue';
import { MediaType } from '../constants/media';
import IssueComment from '../entity/IssueComment';
import notificationManager, { Notification } from '../lib/notifications';

@EventSubscriber()
export class IssueCommentSubscriber
  implements EntitySubscriberInterface<IssueComment>
{
  public listenTo(): typeof IssueComment {
    return IssueComment;
  }

  private async sendIssueCommentNotification(entity: IssueComment) {
    const issueCommentRepository = getRepository(IssueComment);
    let title: string;
    let image: string;
    const tmdb = new TheMovieDb();
    const issuecomment = await issueCommentRepository.findOne({
      where: { id: entity.id },
      relations: ['issue'],
    });

    const issue = issuecomment?.issue;

    if (!issue) {
      return;
    }

    if (issue.media.mediaType === MediaType.MOVIE) {
      const movie = await tmdb.getMovie({ movieId: issue.media.tmdbId });

      title = `${movie.title}${
        movie.release_date ? ` (${movie.release_date.slice(0, 4)})` : ''
      }`;
      image = `https://image.tmdb.org/t/p/w600_and_h900_bestv2${movie.poster_path}`;
    } else {
      const tvshow = await tmdb.getTvShow({ tvId: issue.media.tmdbId });

      title = `${tvshow.name}${
        tvshow.first_air_date ? ` (${tvshow.first_air_date.slice(0, 4)})` : ''
      }`;
      image = `https://image.tmdb.org/t/p/w600_and_h900_bestv2${tvshow.poster_path}`;
    }

    const [firstComment] = sortBy(issue.comments, 'id');

    if (entity.id !== firstComment.id) {
      const notificationPayload = {
        event: `New Comment on ${
          issue.issueType !== IssueType.OTHER
            ? `${IssueTypeName[issue.issueType]} `
            : ''
        }Issue`,
        subject: title,
        message: firstComment.message,
        comment: entity,
        image,
      };

      // Send notifications to all issue managers
      notificationManager.sendNotification(
        Notification.ISSUE_COMMENT,
        notificationPayload
      );

      // Send notification to issue creator (if it isn't their own comment)
      if (issue.createdBy.id !== entity.user.id) {
        notificationManager.sendNotification(Notification.ISSUE_COMMENT, {
          ...notificationPayload,
          notifyUser: issue.createdBy,
        });
      }
    }
  }

  public afterInsert(event: InsertEvent<IssueComment>): void {
    if (!event.entity) {
      return;
    }

    this.sendIssueCommentNotification(event.entity);
  }
}
