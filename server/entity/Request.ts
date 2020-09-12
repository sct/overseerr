import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User';

export enum Status {
  PENDING,
  APPROVED,
  DECLINED,
  AVAILABLE,
}

@Entity()
class Request {
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

export default Request;
