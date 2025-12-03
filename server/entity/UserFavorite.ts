import { MediaType } from '@server/constants/media';
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';
import { User } from './User';

@Entity()
@Unique(['user', 'tmdbId', 'mediaType'])
export class UserFavorite {
    @PrimaryGeneratedColumn()
    public id: number;

    @ManyToOne(() => User, (user: User) => user.favorites, {
        onDelete: 'CASCADE',
    })
    public user: User;

    @Column()
    public tmdbId: number;

    @Column({ type: 'varchar' })
    public mediaType: MediaType;

    @CreateDateColumn()
    public createdAt: Date;
}

export default UserFavorite;


