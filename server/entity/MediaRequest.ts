import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  getRepository,
  In,
  Index,
} from 'typeorm';
import { User } from './User';

export enum MediaRequestStatus {
  PENDING = 1,
  APPROVED,
  DECLINED,
  AVAILABLE,
}

@Entity()
export class MediaRequest {
  public static async getRelatedRequests(
    mediaIds: number | number[]
  ): Promise<MediaRequest[]> {
    const requestRepository = getRepository(MediaRequest);

    try {
      let finalIds: number[];
      if (!Array.isArray(mediaIds)) {
        finalIds = [mediaIds];
      } else {
        finalIds = mediaIds;
      }

      const requests = await requestRepository.find({ mediaId: In(finalIds) });

      return requests;
    } catch (e) {
      console.error(e.messaage);
      return [];
    }
  }

  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ unique: true })
  @Index()
  public mediaId: number;

  @Column()
  public mediaType: 'movie' | 'tv';

  @Column({ type: 'integer' })
  public status: MediaRequestStatus;

  @ManyToOne(() => User, (user) => user.requests, { eager: true })
  public requestedBy: User;

  @ManyToOne(() => User, { nullable: true })
  public modifiedBy?: User;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  constructor(init?: Partial<MediaRequest>) {
    Object.assign(this, init);
  }
}
