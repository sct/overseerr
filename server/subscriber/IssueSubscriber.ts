import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import TheMovieDb from '../api/themoviedb';
import { MediaType } from '../constants/media';
import Issue from '../entity/Issue';
import notificationManager, { Notification } from '../lib/notifications';

@EventSubscriber()
export class IssueSubscriber implements EntitySubscriberInterface<Issue> {
  public listenTo(): typeof Issue {
    return Issue;
  }

  private async sendIssueCreatedNotification(entity: Issue) {
    let title: string;
    let image: string;
    const tmdb = new TheMovieDb();
    if (entity.media.mediaType === MediaType.MOVIE) {
      const movie = await tmdb.getMovie({ movieId: entity.media.tmdbId });

      title = movie.title;
      image = `https://image.tmdb.org/t/p/w600_and_h900_bestv2${movie.poster_path}`;
    } else {
      const tvshow = await tmdb.getTvShow({ tvId: entity.media.tmdbId });

      title = tvshow.name;
      image = `https://image.tmdb.org/t/p/w600_and_h900_bestv2${tvshow.poster_path}`;
    }

    const [firstComment] = entity.comments;

    notificationManager.sendNotification(Notification.ISSUE_CREATED, {
      subject: title,
      message: firstComment.message,
      issue: entity,
      image,
    });
  }

  public afterInsert(event: InsertEvent<Issue>): void {
    if (!event.entity) {
      return;
    }

    this.sendIssueCreatedNotification(event.entity);
  }
}
