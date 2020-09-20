import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  TableInheritance,
  AfterUpdate,
  AfterInsert,
  getRepository,
} from 'typeorm';
import { User } from './User';
import Media from './Media';
import { MediaStatus, MediaRequestStatus, MediaType } from '../constants/media';

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export class MediaRequest {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'integer' })
  public status: MediaRequestStatus;

  @ManyToOne(() => Media, (media) => media.requests, { eager: true })
  public media: Media;

  @ManyToOne(() => User, (user) => user.requests, { eager: true })
  public requestedBy: User;

  @ManyToOne(() => User, { nullable: true })
  public modifiedBy?: User;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  @Column()
  public type: MediaType;

  constructor(init?: Partial<MediaRequest>) {
    Object.assign(this, init);
  }

  @AfterUpdate()
  @AfterInsert()
  private async updateParentStatus() {
    const mediaRepository = getRepository(Media);
    if (this.status === MediaRequestStatus.APPROVED) {
      this.media.status = MediaStatus.PROCESSING;
      mediaRepository.save(this.media);
    }
  }
}
