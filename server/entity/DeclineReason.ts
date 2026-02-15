import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class DeclineReason {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'text' })
  public reason: string;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  constructor(init?: Partial<DeclineReason>) {
    Object.assign(this, init);
  }
}

export default DeclineReason;
