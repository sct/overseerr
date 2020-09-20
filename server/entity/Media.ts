import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  getRepository,
  In,
} from 'typeorm';
import { MediaRequest } from './MediaRequest';
import { MediaStatus, MediaType } from '../constants/media';

@Entity()
class Media {
  public static async getRelatedMedia(
    tmdbIds: number | number[]
  ): Promise<Media[]> {
    const mediaRepository = getRepository(Media);

    try {
      let finalIds: number[];
      if (!Array.isArray(tmdbIds)) {
        finalIds = [tmdbIds];
      } else {
        finalIds = tmdbIds;
      }

      const media = await mediaRepository.find({
        tmdbId: In(finalIds),
      });

      return media;
    } catch (e) {
      console.error(e.messaage);
      return [];
    }
  }

  public static async getMedia(id: number): Promise<Media | undefined> {
    const mediaRepository = getRepository(Media);

    try {
      const media = await mediaRepository.findOneOrFail({
        where: { tmdbId: id },
      });

      return media;
    } catch (e) {
      console.error(e.messaage);
      return undefined;
    }
  }

  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'varchar' })
  public mediaType: MediaType;

  @Column({ unique: true })
  @Index()
  public tmdbId: number;

  @Column({ unique: true, nullable: true })
  @Index()
  public tvdbId: number;

  @Column({ type: 'int', default: MediaStatus.UNKNOWN })
  public status: MediaStatus;

  @OneToMany(() => MediaRequest, (request) => request.media)
  public requests: MediaRequest;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  constructor(init?: Partial<Media>) {
    Object.assign(this, init);
  }
}

export default Media;
