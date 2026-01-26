import { User } from '@server/entity/User';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class ApiKey {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public name: string;

  @Index({ unique: true })
  @Column()
  public keyHash: string;

  @Column()
  public last4: string;

  @Column({ type: 'integer', default: 0 })
  public permissions = 0;

  @Column({ type: 'boolean', default: true })
  public isActive = true;

  @Column({ type: 'datetime', nullable: true })
  public lastUsedAt?: Date | null;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  public user: User;

  @CreateDateColumn()
  public createdAt: Date;
}

