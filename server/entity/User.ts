import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  RelationCount,
  AfterLoad,
} from 'typeorm';
import { Permission, hasPermission } from '../lib/permissions';
import { MediaRequest } from './MediaRequest';
import bcrypt from 'bcrypt';
import path from 'path';
import PreparedEmail from '../lib/email';
import logger from '../logger';
import { getSettings } from '../lib/settings';
import { default as generatePassword } from 'secure-random-password';
import { UserType } from '../constants/user';

@Entity()
export class User {
  public static filterMany(users: User[]): Partial<User>[] {
    return users.map((u) => u.filter());
  }

  static readonly filteredFields: string[] = ['plexToken', 'password'];

  public displayName: string;

  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ unique: true })
  public email: string;

  @Column({ nullable: true })
  public plexUsername: string;

  @Column({ nullable: true })
  public username?: string;

  @Column({ nullable: true, select: false })
  public password?: string;

  @Column({ type: 'integer', default: UserType.PLEX })
  public userType: UserType;

  @Column({ nullable: true, select: false })
  public plexId?: number;

  @Column({ nullable: true, select: false })
  public plexToken?: string;

  @Column({ type: 'integer', default: 0 })
  public permissions = 0;

  @Column()
  public avatar: string;

  @RelationCount((user: User) => user.requests)
  public requestCount: number;

  @OneToMany(() => MediaRequest, (request) => request.requestedBy)
  public requests: MediaRequest[];

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

  public passwordMatch(password: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.password) {
        resolve(bcrypt.compare(password, this.password));
      } else {
        return reject(false);
      }
    });
  }

  public async setPassword(password: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(password, 12);
    this.password = hashedPassword;
  }

  public async resetPassword(): Promise<void> {
    const password = generatePassword.randomPassword({ length: 16 });
    this.setPassword(password);

    const applicationUrl = getSettings().main.applicationUrl;
    try {
      logger.info(`Sending password email for ${this.email}`, {
        label: 'User creation',
      });
      const email = new PreparedEmail();
      await email.send({
        template: path.join(__dirname, '../templates/email/password'),
        message: {
          to: this.email,
        },
        locals: {
          password: password,
          applicationUrl,
        },
      });
    } catch (e) {
      logger.error('Failed to send out password email', {
        label: 'User creation',
        message: e.message,
      });
    }
  }

  @AfterLoad()
  public setDisplayName(): void {
    this.displayName = this.username || this.plexUsername;
  }
}
