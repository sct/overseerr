import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  hasNotificationAgentEnabled,
  NotificationAgentType,
} from '../lib/notifications/agenttypes';
import { User } from './User';

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

  @Column({ nullable: true })
  public region?: string;

  @Column({ nullable: true })
  public originalLanguage?: string;

  @Column({ type: 'integer', default: NotificationAgentType.EMAIL })
  public notificationAgents = NotificationAgentType.EMAIL;

  @Column({ nullable: true })
  public pgpKey?: string;

  @Column({ nullable: true })
  public discordId?: string;

  @Column({ nullable: true })
  public telegramChatId?: string;

  @Column({ nullable: true })
  public telegramSendSilently?: boolean;

  public hasNotificationAgentEnabled(agent: NotificationAgentType): boolean {
    return !!hasNotificationAgentEnabled(agent, this.notificationAgents);
  }
}
