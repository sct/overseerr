import { MediaRequestStatus, MediaStatus } from '@server/constants/media';
import { getRepository } from '@server/datasource';
import SeasonRequest from '@server/entity/SeasonRequest';
import {
  AfterUpdate,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import Media from './Media';

@Entity()
class Season {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public seasonNumber: number;

  @Column({ type: 'int', default: MediaStatus.UNKNOWN })
  public status: MediaStatus;

  @Column({ type: 'int', default: MediaStatus.UNKNOWN })
  public status4k: MediaStatus;

  @ManyToOne(() => Media, (media) => media.seasons, { onDelete: 'CASCADE' })
  public media: Promise<Media>;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  constructor(init?: Partial<Season>) {
    Object.assign(this, init);
  }

  @AfterUpdate()
  public async updateSeasonRequests(): Promise<void> {
    const seasonRequestRepository = getRepository(SeasonRequest);

    const relatedSeasonRequests = await seasonRequestRepository.find({
      relations: {
        request: true,
      },
      where: {
        request: { media: { id: (await this.media).id } },
        seasonNumber: this.seasonNumber,
      },
    });

    // Check seasons when/if they become available or deleted,
    // then set the related season request to completed
    relatedSeasonRequests.forEach((seasonRequest) => {
      if (
        this.seasonNumber === seasonRequest.seasonNumber &&
        ((!seasonRequest.request.is4k &&
          (this.status === MediaStatus.AVAILABLE ||
            this.status === MediaStatus.DELETED)) ||
          (seasonRequest.request.is4k &&
            this.status4k === MediaStatus.AVAILABLE) ||
          this.status4k === MediaStatus.DELETED)
      )
        seasonRequest.status = MediaRequestStatus.COMPLETED;
    });
    seasonRequestRepository.save(relatedSeasonRequests);
  }
}

export default Season;
