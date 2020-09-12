import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Permission, hasPermission } from '../lib/permissions';
import { MediaRequest } from './MediaRequest';

@Entity()
export class User {
  public static filterMany(users: User[]): Partial<User>[] {
    return users.map((u) => u.filter());
  }

  static readonly filteredFields: string[] = ['plexToken'];

  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ unique: true })
  public email: string;

  @Column()
  public username: string;

  @Column({ select: false })
  public plexId: number;

  @Column({ nullable: true, select: false })
  public plexToken?: string;

  @Column({ type: 'integer', default: 0 })
  public permissions = 0;

  @Column()
  public avatar: string;

  @OneToMany(() => MediaRequest, (request) => request.requestedBy)
  public requests: MediaRequest;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  constructor(init?: Partial<User>) {
    Object.assign(this, init);
  }

  public filter(): Partial<User> {
    const filtered: Partial<User> = Object.assign(
      {},
      ...(Object.keys(this) as (keyof User)[])
        .filter((k) => !User.filteredFields.includes(k))
        .map((k) => ({ [k]: this[k] }))
    );

    return filtered;
  }

  public hasPermission(permissions: Permission | Permission[]): boolean {
    return !!hasPermission(permissions, this.permissions);
  }
}
