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
import Media from '../entity/Media';
import notificationManager, { Notification } from '../lib/notifications';
import { Permission } from '../lib/permissions';

@EventSubscriber()
export class IssueCommentSubscriber
  implements EntitySubscriberInterface<IssueComment>
{
  public listenTo(): typeof IssueComment {
    return IssueComment;
  }

  private async sendIssueCommentNotification(entity: IssueComment) {
    let title: string;
    let image: string;
    const tmdb = new TheMovieDb();

    const issue = (
      await getRepository(IssueComment).findOne({
        where: { id: entity.id },
        relations: ['issue'],
      })
    )?.issue;
    if (!issue) {
      return;
    }

    const media = await getRepository(Media).findOne({
      where: { id: issue.media.id },
    });
    if (!media) {
      return;
    }

    if (media.mediaType === MediaType.MOVIE) {
      const movie = await tmdb.getMovie({ movieId: media.tmdbId });

      title = `${movie.title}${
        movie.release_date ? ` (${movie.release_date.slice(0, 4)})` : ''
      }`;
      image = `https://image.tmdb.org/t/p/w600_and_h900_bestv2${movie.poster_path}`;
    } else {
      const tvshow = await tmdb.getTvShow({ tvId: media.tmdbId });

      title = `${tvshow.name}${
        tvshow.first_air_date ? ` (${tvshow.first_air_date.slice(0, 4)})` : ''
      }`;
      image = `https://image.tmdb.org/t/p/w600_and_h900_bestv2${tvshow.poster_path}`;
    }

    const [firstComment] = sortBy(issue.comments, 'id');

    if (entity.id !== firstComment.id) {
      // Send notifications to all issue managers
      notificationManager.sendNotification(Notification.ISSUE_COMMENT, {
        event: `New Comment on ${
          issue.issueType !== IssueType.OTHER
            ? `${IssueTypeName[issue.issueType]} `
            : ''
        }Issue`,
        subject: title,
        message: firstComment.message,
        comment: entity,
        issue,
        media,
        image,
        notifyAdmin: true,
        notifyUser:
          !issue.createdBy.hasPermission(Permission.MANAGE_ISSUES) &&
          issue.createdBy.id !== entity.user.id
            ? issue.createdBy
            : undefined,
      });
    }
  }

  public afterInsert(event: InsertEvent<IssueComment>): void {
    if (!event.entity) {
      return;
    }

    this.sendIssueCommentNotification(event.entity);
  }
}
