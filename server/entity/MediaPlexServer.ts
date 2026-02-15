import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import Media from './Media';

@Entity()
class MediaPlexServer {
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(() => Media, (media) => media.plexServers, {
    onDelete: 'CASCADE',
  })
  public media: Media;

  @Column()
  @Index()
  public plexServerId: number;

  @Column({ nullable: true, type: 'varchar' })
  public ratingKey?: string | null;

  @Column({ nullable: true, type: 'varchar' })
  public ratingKey4k?: string | null;

  constructor(init?: Partial<MediaPlexServer>) {
    Object.assign(this, init);
  }
}

export default MediaPlexServer;
