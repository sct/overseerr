import { ApiKey } from '@server/entity/ApiKey';
import { AuditLog } from '@server/entity/AuditLog';
import DiscoverSlider from '@server/entity/DiscoverSlider';
import Issue from '@server/entity/Issue';
import IssueComment from '@server/entity/IssueComment';
import Media from '@server/entity/Media';
import MediaRequest from '@server/entity/MediaRequest';
import Season from '@server/entity/Season';
import SeasonRequest from '@server/entity/SeasonRequest';
import { Session } from '@server/entity/Session';
import { User } from '@server/entity/User';
import { UserPushSubscription } from '@server/entity/UserPushSubscription';
import { UserSettings } from '@server/entity/UserSettings';
import path from 'path';
import 'reflect-metadata';
import type { DataSourceOptions, EntityTarget, Repository } from 'typeorm';
import { DataSource } from 'typeorm';

const projectRoot = path.resolve(__dirname, '..');
const entities = [
  ApiKey,
  AuditLog,
  DiscoverSlider,
  Issue,
  IssueComment,
  Media,
  MediaRequest,
  Season,
  SeasonRequest,
  Session,
  User,
  UserPushSubscription,
  UserSettings,
];

const devConfig: DataSourceOptions = {
  type: 'sqlite',
  database: process.env.CONFIG_DIRECTORY
    ? `${process.env.CONFIG_DIRECTORY}/db/db.sqlite3`
    : path.join(projectRoot, 'config', 'db', 'db.sqlite3'),
  synchronize: true,
  migrationsRun: false,
  logging: false,
  enableWAL: true,
  entities,
  migrations: [path.join(projectRoot, 'server', 'migration', '**', '*.ts')],
  subscribers: [path.join(projectRoot, 'server', 'subscriber', '**', '*.ts')],
};

const prodConfig: DataSourceOptions = {
  type: 'sqlite',
  database: process.env.CONFIG_DIRECTORY
    ? `${process.env.CONFIG_DIRECTORY}/db/db.sqlite3`
    : path.join(projectRoot, 'config', 'db', 'db.sqlite3'),
  synchronize: false,
  migrationsRun: false,
  logging: false,
  enableWAL: true,
  entities,
  migrations: [path.join(projectRoot, 'dist', 'migration', '**', '*.js')],
  subscribers: [path.join(projectRoot, 'dist', 'subscriber', '**', '*.js')],
};

const dataSource = new DataSource(
  process.env.NODE_ENV !== 'production' ? devConfig : prodConfig
);

export const getRepository = <Entity extends object>(
  target: EntityTarget<Entity>
): Repository<Entity> => {
  return dataSource.getRepository(target);
};

export default dataSource;
