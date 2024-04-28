import type { MigrationInterface, QueryRunner } from 'typeorm';

export class PostLidarrSupportIntegration1714310036946
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE user ADD musicQuotaLimit INTEGER`);
    await queryRunner.query(`ALTER TABLE user ADD musicQuotaDays INTEGER`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('PRAGMA foreign_keys=off');

    await queryRunner.query('BEGIN TRANSACTION');

    await queryRunner.query('ALTER TABLE user RENAME TO _user_old');

    await queryRunner.query(
      "CREATE TABLE user (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,email VARCHAR NOT NULL,plexUsername VARCHAR,username VARCHAR,password VARCHAR,resetPasswordHuid VARCHAR,recoveryLinkExpirationDate DATETIME,userType INTEGER NOT NULL DEFAULT 1,plexId INTEGER,plexToken VARCHAR,permissions INTEGER NOT NULL DEFAULT 0,avatar VARCHAR NOT NULL,movieQuotaLimit INTEGER,movieQuotaDays INTEGER,tvQuotaLimit INTEGER,tvQuotaDays INTEGER,createdAt DATETIME NOT NULL DEFAULT (datetime('now')),updatedAt DATETIME NOT NULL DEFAULT (datetime('now')) )"
    );

    await queryRunner.query(
      'INSERT INTO user (id, email, plexUsername, username, password, resetPasswordHuid, recoveryLinkExpirationDate, userType, plexId, plexToken, permissions, avatar, movieQuotaLimit, movieQuotaDays, tvQuotaLimit, tvQuotaDays, createdAt, updatedAt) SELECT id, email, plexUsername, username, password, resetPasswordHuid, recoveryLinkExpirationDate, userType, plexId, plexToken, permissions, avatar, movieQuotaLimit, movieQuotaDays, tvQuotaLimit, tvQuotaDays, createdAt, updatedAt FROM _user_old'
    );

    await queryRunner.query('COMMIT');

    await queryRunner.query('PRAGMA foreign_keys=on');
  }
}
