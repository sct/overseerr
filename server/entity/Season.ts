import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MediaStatus } from '../constants/media';
import Media from './Media';

@Entity()
class Season {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public seasonNumber: number;

  @Column({ type: 'int', default: MediaStatus.UNKNOWN })
  public status: MediaStatus;

  @ManyToOne(() => Media, (media) => media.seasons)
  public media: Media;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  constructor(init?: Partial<Season>) {
    Object.assign(this, init);
  }
}

export default Season;
