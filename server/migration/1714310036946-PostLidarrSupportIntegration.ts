import type { MigrationInterface, QueryRunner } from 'typeorm';

export class PostLidarrSupportIntegration1714310036946
  implements MigrationInterface
{
  name = 'PostLidarrSupportIntegration1714310036946';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE user ADD musicQuotaLimit INTEGER`);
    await queryRunner.query(`ALTER TABLE user ADD musicQuotaDays INTEGER`);

    await queryRunner.query(
      "CREATE TABLE temporary_media (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,mediaType VARCHAR NOT NULL,title VARCHAR,secondaryType VARCHAR,tmdbId INTEGER,mbid VARCHAR,tvdbId INTEGER,imdbId VARCHAR,musicdbId INTEGER,status INTEGER NOT NULL DEFAULT 1,status4k INTEGER NOT NULL DEFAULT 1,createdAt DATETIME NOT NULL DEFAULT (datetime('now')),updatedAt DATETIME NOT NULL DEFAULT (datetime('now')),lastSeasonChange DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,mediaAddedAt DATETIME,serviceId INTEGER,serviceId4k INTEGER,externalServiceId INTEGER,externalServiceId4k INTEGER,externalServiceSlug VARCHAR,externalServiceSlug4k VARCHAR,ratingKey VARCHAR,ratingKey4k VARCHAR,parentRatingKey VARCHAR)"
    );

    await queryRunner.query(
      'INSERT INTO temporary_media (id, mediaType, tmdbId, tvdbId, imdbId, status, status4k, createdAt, updatedAt, lastSeasonChange, mediaAddedAt, serviceId, serviceId4k, externalServiceId, externalServiceId4k, externalServiceSlug, externalServiceSlug4k, ratingKey, ratingKey4k) SELECT id, mediaType, tmdbId, tvdbId, imdbId, status, status4k, createdAt, updatedAt, lastSeasonChange, mediaAddedAt, serviceId, serviceId4k, externalServiceId, externalServiceId4k, externalServiceSlug, externalServiceSlug4k, ratingKey, ratingKey4k FROM media'
    );

    await queryRunner.query(`DROP TABLE media`);

    await queryRunner.query(`ALTER TABLE temporary_media RENAME TO media`);

    await queryRunner.query(
      `ALTER TABLE media_request ADD secondaryType VARCHAR`
    );
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

    await queryRunner.query('BEGIN TRANSACTION');

    await queryRunner.query('ALTER TABLE media RENAME TO _media_old');

    await queryRunner.query(
      "CREATE TABLE media (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,mediaType VARCHAR NOT NULL,tmdbId INTEGER NOT NULL,tvdbId INTEGER,imdbId VARCHAR,status INTEGER NOT NULL DEFAULT 1,status4k INTEGER NOT NULL DEFAULT 1,createdAt DATETIME NOT NULL DEFAULT (datetime('now')),updatedAt DATETIME NOT NULL DEFAULT (datetime('now')),lastSeasonChange DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,mediaAddedAt DATETIME,serviceId INTEGER,serviceId4k INTEGER,externalServiceId INTEGER,externalServiceId4k INTEGER,externalServiceSlug VARCHAR,externalServiceSlug4k VARCHAR,ratingKey VARCHAR,ratingKey4k VARCHAR)"
    );

    await queryRunner.query(
      'INSERT INTO media (id, mediaType, tmdbId, tvdbId, imdbId, status, status4k, createdAt, updatedAt, lastSeasonChange, mediaAddedAt, serviceId, serviceId4k, externalServiceId, externalServiceId4k, externalServiceSlug, externalServiceSlug4k, ratingKey, ratingKey4k) SELECT id, mediaType, tmdbId, tvdbId, imdbId, status, status4k, createdAt, updatedAt, lastSeasonChange, mediaAddedAt, serviceId, serviceId4k, externalServiceId, externalServiceId4k, externalServiceSlug, externalServiceSlug4k, ratingKey, ratingKey4k FROM _media_old'
    );

    await queryRunner.query('COMMIT');

    await queryRunner.query('BEGIN TRANSACTION');

    await queryRunner.query(
      'ALTER TABLE media_request RENAME TO _media_request_old'
    );

    await queryRunner.query(
      "CREATE TABLE media_request (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,status INTEGER NOT NUL,createdAt DATETIME NOT NULL DEFAULT (datetime('now')),updatedAt DATETIME NOT NULL DEFAULT (datetime('now')),type VARCHAR NOT NULL,is4k BOOLEAN NOT NULL DEFAULT 0,serverId INTEGER,profileId INTEGER,rootFolder VARCHAR,languageProfileId INTEGER,tags TEXT,isAutoRequest BOOLEAN NOT NULL DEFAULT 0,mediaId INTEGER,requestedById INTEGER,modifiedById INTEGER)"
    );

    await queryRunner.query(
      'INSERT INTO media_request (id, status, createdAt, updatedAt, type, is4k, serverId, profileId, rootFolder, languageProfileId, tags, isAutoRequest, mediaId, requestedById, modifiedById) SELECT id, status, createdAt, updatedAt, type, is4k, serverId, profileId, rootFolder, languageProfileId, tags, isAutoRequest, mediaId, requestedById, modifiedById FROM _media_request_old'
    );

    await queryRunner.query('COMMIT');

    await queryRunner.query('PRAGMA foreign_keys=on');
  }
}
