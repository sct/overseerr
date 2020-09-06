import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Permission, hasPermission } from '../lib/permissions';

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

  @Column({ nullable: true })
  public plexToken?: string;

  @Column({ type: 'integer', default: 0 })
  public permissions = 0;

  @Column()
  public avatar: string;

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
