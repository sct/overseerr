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
export class AuditLog {
  @PrimaryGeneratedColumn()
  public id: number;

  @Index()
  @Column()
  public action: string;

  @Column({ nullable: true })
  public entityType?: string;

  @Column({ nullable: true })
  public entityId?: string;

  @Column({ nullable: true })
  public ip?: string;

  @Column({ type: 'simple-json', nullable: true })
  public meta?: Record<string, unknown>;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  public user?: User;

  @CreateDateColumn()
  public createdAt: Date;
}

