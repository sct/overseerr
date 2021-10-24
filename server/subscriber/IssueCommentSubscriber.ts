import {
  EntitySubscriberInterface,
  EventSubscriber,
  getRepository,
  InsertEvent,
} from 'typeorm';
import TheMovieDb from '../api/themoviedb';
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

      title = movie.title;
      image = `https://image.tmdb.org/t/p/w600_and_h900_bestv2${movie.poster_path}`;
    } else {
      const tvshow = await tmdb.getTvShow({ tvId: issue.media.tmdbId });

      title = tvshow.name;
      image = `https://image.tmdb.org/t/p/w600_and_h900_bestv2${tvshow.poster_path}`;
    }

    notificationManager.sendNotification(Notification.ISSUE_COMMENT, {
      subject: `New Issue Comment: ${title}`,
      message: entity.message,
      issue,
      image,
      notifyUser:
        issue.createdBy.id !== entity.user.id ? issue.createdBy : undefined,
    });
  }

  public afterInsert(event: InsertEvent<IssueComment>): void {
    if (!event.entity) {
      return;
    }

    this.sendIssueCommentNotification(event.entity);
  }
}
