import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NotificationAgentTypes } from '../interfaces/api/userSettingsInterfaces';
import { hasNotificationType, Notification } from '../lib/notifications';
import { NotificationAgentKey } from '../lib/settings';
import { User } from './User';

export const ALL_NOTIFICATIONS = Object.values(Notification)
  .filter((v) => !isNaN(Number(v)))
  .reduce((a, v) => a + Number(v), 0);

@Entity()
export class UserSettings {
  constructor(init?: Partial<UserSettings>) {
    Object.assign(this, init);
  }

  @PrimaryGeneratedColumn()
  public id: number;

  @OneToOne(() => User, (user) => user.settings, { onDelete: 'CASCADE' })
  @JoinColumn()
  public user: User;

  @Column({ default: 'en' })
  public locale?: string;

  @Column({ nullable: true })
  public region?: string;

  @Column({ nullable: true })
  public originalLanguage?: string;

  @Column({ nullable: true })
  public pgpKey?: string;

  @Column({ nullable: true })
  public discordId?: string;

  @Column({ nullable: true })
  public telegramChatId?: string;

  @Column({ nullable: true })
  public telegramSendSilently?: boolean;

  @Column({
    type: 'text',
    nullable: true,
    transformer: {
      from: (value: string | null): Partial<NotificationAgentTypes> => {
        if (!value) {
          return {
            email: ALL_NOTIFICATIONS,
            discord: 0,
            pushbullet: 0,
            pushover: 0,
            slack: 0,
            telegram: 0,
            webhook: 0,
            webpush: ALL_NOTIFICATIONS,
          };
        }

        const values = JSON.parse(value) as Partial<NotificationAgentTypes>;

        if (values.email == null) {
          values.email = ALL_NOTIFICATIONS;
        }

        if (values.webpush == null) {
          values.webpush = ALL_NOTIFICATIONS;
        }

        return values;
      },
      to: (value: Partial<NotificationAgentTypes>): string => {
        return JSON.stringify(value);
      },
    },
  })
  public notificationTypes: Partial<NotificationAgentTypes>;

  public hasNotificationType(key: NotificationAgentKey, type: Notification) {
    return hasNotificationType(type, this.notificationTypes[key] ?? 0);
  }
}
