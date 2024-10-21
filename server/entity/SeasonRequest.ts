import { MediaRequestStatus } from '@server/constants/media';
import { getRepository } from '@server/datasource';
import {
  AfterUpdate,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MediaRequest } from './MediaRequest';

@Entity()
class SeasonRequest {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public seasonNumber: number;

  @Column({ type: 'int', default: MediaRequestStatus.PENDING })
  public status: MediaRequestStatus;

  @ManyToOne(() => MediaRequest, (request) => request.seasons, {
    onDelete: 'CASCADE',
  })
  public request: MediaRequest;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  constructor(init?: Partial<SeasonRequest>) {
    Object.assign(this, init);
  }

  @AfterUpdate()
  public async updateMediaRequests(): Promise<void> {
    const requestRepository = getRepository(MediaRequest);

    const relatedRequest = await requestRepository.findOne({
      where: { id: this.request.id },
    });

    // Check the parent of the season request and
    // if every season request is complete
    // set the parent request to complete as well
    const isRequestComplete = relatedRequest?.seasons.every(
      (seasonRequest) => seasonRequest.status === MediaRequestStatus.COMPLETED
    );

    if (isRequestComplete && relatedRequest) {
      relatedRequest.status = MediaRequestStatus.COMPLETED;

      requestRepository.save(relatedRequest);
    }
  }
}

export default SeasonRequest;
