import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  RelationCount,
  AfterLoad,
  OneToOne,
  getRepository,
  Not,
  MoreThan,
} from 'typeorm';
import {
  Permission,
  hasPermission,
  PermissionCheckOptions,
} from '../lib/permissions';
import { MediaRequest } from './MediaRequest';
import bcrypt from 'bcrypt';
import path from 'path';
import PreparedEmail from '../lib/email';
import logger from '../logger';
import { getSettings } from '../lib/settings';
import { default as generatePassword } from 'secure-random-password';
import { UserType } from '../constants/user';
import { v4 as uuid } from 'uuid';
import { UserSettings } from './UserSettings';
import { MediaType, MediaRequestStatus } from '../constants/media';
import SeasonRequest from './SeasonRequest';

@Entity()
export class User {
  public static filterMany(
    users: User[],
    showFiltered?: boolean
  ): Partial<User>[] {
    return users.map((u) => u.filter(showFiltered));
  }

  static readonly filteredFields: string[] = ['email'];

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

  @Column({ nullable: true, select: false })
  public resetPasswordGuid?: string;

  @Column({ type: 'date', nullable: true })
  public recoveryLinkExpirationDate?: Date | null;

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

  @Column({ nullable: true })
  public movieQuotaLimit: number;

  @Column({ nullable: true })
  public movieQuotaDays: number;

  @Column({ nullable: true })
  public tvQuotaLimit: number;

  @Column({ nullable: true })
  public tvQuotaDays: number;

  @OneToOne(() => UserSettings, (settings) => settings.user, {
    cascade: true,
    eager: true,
    onDelete: 'CASCADE',
  })
  public settings?: UserSettings;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  constructor(init?: Partial<User>) {
    Object.assign(this, init);
  }

  public filter(showFiltered?: boolean): Partial<User> {
    const filtered: Partial<User> = Object.assign(
      {},
      ...(Object.keys(this) as (keyof User)[])
        .filter((k) => showFiltered || !User.filteredFields.includes(k))
        .map((k) => ({ [k]: this[k] }))
    );

    return filtered;
  }

  public hasPermission(
    permissions: Permission | Permission[],
    options?: PermissionCheckOptions
  ): boolean {
    return !!hasPermission(permissions, this.permissions, options);
  }

  public passwordMatch(password: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.password) {
        resolve(bcrypt.compare(password, this.password));
      } else {
        return resolve(false);
      }
    });
  }

  public async setPassword(password: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(password, 12);
    this.password = hashedPassword;
  }

  public async generatePassword(): Promise<void> {
    const password = generatePassword.randomPassword({ length: 16 });
    this.setPassword(password);

    const { applicationTitle, applicationUrl } = getSettings().main;
    try {
      logger.info(`Sending generated password email for ${this.email}`, {
        label: 'User Management',
      });
      const email = new PreparedEmail();
      await email.send({
        template: path.join(__dirname, '../templates/email/generatedpassword'),
        message: {
          to: this.email,
        },
        locals: {
          password: password,
          applicationUrl,
          applicationTitle,
        },
      });
    } catch (e) {
      logger.error('Failed to send out generated password email', {
        label: 'User Management',
        message: e.message,
      });
    }
  }

  public async resetPassword(): Promise<void> {
    const guid = uuid();
    this.resetPasswordGuid = guid;

    // 24 hours into the future
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 1);
    this.recoveryLinkExpirationDate = targetDate;

    const { applicationTitle, applicationUrl } = getSettings().main;
    const resetPasswordLink = `${applicationUrl}/resetpassword/${guid}`;

    try {
      logger.info(`Sending reset password email for ${this.email}`, {
        label: 'User Management',
      });
      const email = new PreparedEmail();
      await email.send({
        template: path.join(__dirname, '../templates/email/resetpassword'),
        message: {
          to: this.email,
        },
        locals: {
          resetPasswordLink,
          applicationUrl: resetPasswordLink,
          applicationTitle,
        },
      });
    } catch (e) {
      logger.error('Failed to send out reset password email', {
        label: 'User Management',
        message: e.message,
      });
    }
  }

  @AfterLoad()
  public setDisplayName(): void {
    this.displayName = this.username || this.plexUsername;
  }

  public async getQuota(): Promise<{
    movie: {
      days: number | undefined;
      limit: number | undefined;
      used: number;
      remaining: number | undefined;
    };
    tv: {
      days: number | undefined;
      limit: number | undefined;
      used: number;
      remaining: number | undefined;
    };
  }> {
    const requestRepository = getRepository(MediaRequest);

    // Count movie requests made during quota period
    const movieDate = new Date();
    if (this.movieQuotaDays) {
      movieDate.setDate(movieDate.getDate() - this.movieQuotaDays);
    } else {
      movieDate.setDate(0);
    }
    // YYYY-MM-DD format
    const movieQuotaStartDate = movieDate.toJSON().split('T')[0];
    const movieQuotaUsed = await requestRepository.count({
      where: {
        requestedBy: this,
        createdAt: MoreThan(movieQuotaStartDate),
        type: MediaType.MOVIE,
        status: Not(MediaRequestStatus.DECLINED),
      },
    });

    // Count tv season requests made during quota period
    const tvDate = new Date();
    if (this.tvQuotaDays) {
      tvDate.setDate(tvDate.getDate() - this.tvQuotaDays);
    } else {
      tvDate.setDate(0);
    }
    // YYYY-MM-DD format
    const tvQuotaStartDate = tvDate.toJSON().split('T')[0];
    const tvQuotaUsed = (
      await requestRepository
        .createQueryBuilder('request')
        .leftJoin('request.seasons', 'seasons')
        .leftJoin('request.requestedBy', 'requestedBy')
        .where('request.type = :requestType', {
          requestType: MediaType.TV,
        })
        .andWhere('requestedBy.id = :userId', {
          userId: this.id,
        })
        .andWhere('request.createdAt > :date', {
          date: tvQuotaStartDate,
        })
        .andWhere('request.status != :declinedStatus', {
          declinedStatus: MediaRequestStatus.DECLINED,
        })
        .addSelect((subQuery) => {
          return subQuery
            .select('COUNT(season.id)', 'seasonCount')
            .from(SeasonRequest, 'season')
            .leftJoin('season.request', 'parentRequest')
            .where('parentRequest.id = request.id');
        }, 'seasonCount')
        .getMany()
    ).reduce((sum: number, req: MediaRequest) => sum + req.seasonCount, 0);

    return {
      movie: {
        days: this.movieQuotaDays,
        limit: this.movieQuotaLimit,
        used: movieQuotaUsed,
        remaining: this.movieQuotaLimit
          ? this.movieQuotaLimit - movieQuotaUsed
          : undefined,
      },
      tv: {
        days: this.tvQuotaDays,
        limit: this.tvQuotaLimit,
        used: tvQuotaUsed,
        remaining: this.tvQuotaLimit
          ? this.tvQuotaLimit - tvQuotaUsed
          : undefined,
      },
    };
  }
}
