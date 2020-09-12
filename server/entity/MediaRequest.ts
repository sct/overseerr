import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  getRepository,
  In,
} from 'typeorm';
import { User } from './User';

export enum Status {
  PENDING,
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

  @Column()
  public mediaId: number;

  @Column()
  public mediaType: 'movie' | 'tv';

  @Column({ type: 'integer' })
  public status: Status;

  @ManyToOne(() => User, (user) => user.requests, { eager: true })
  public requestedBy: User;

  @ManyToOne(() => User, { nullable: true })
  public modifiedBy?: User;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  constructor(init?: Partial<User>) {
    Object.assign(this, init);
  }
}
