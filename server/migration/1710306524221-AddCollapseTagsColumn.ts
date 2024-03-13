import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCollapseTagsColumn1710306524221 implements MigrationInterface {
  name = 'AddCollapseTagsColumn1710306524221';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "season_request" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "seasonNumber" integer NOT NULL, "status" integer NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "requestId" integer)`
    );
    await queryRunner.query(
      `CREATE TABLE "user_push_subscription" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "endpoint" varchar NOT NULL, "p256dh" varchar NOT NULL, "auth" varchar NOT NULL, "userId" integer, CONSTRAINT "UQ_f90ab5a4ed54905a4bb51a7148b" UNIQUE ("auth"))`
    );
    await queryRunner.query(
      `CREATE TABLE "user_settings" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "locale" varchar NOT NULL DEFAULT (''), "region" varchar, "originalLanguage" varchar, "pgpKey" varchar, "discordId" varchar, "pushbulletAccessToken" varchar, "pushoverApplicationToken" varchar, "pushoverUserKey" varchar, "pushoverSound" varchar, "telegramChatId" varchar, "telegramSendSilently" boolean, "watchlistSyncMovies" boolean, "watchlistSyncTv" boolean, "collapseTags" boolean, "notificationTypes" text, "userId" integer, CONSTRAINT "REL_986a2b6d3c05eb4091bb8066f7" UNIQUE ("userId"))`
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "email" varchar NOT NULL, "plexUsername" varchar, "username" varchar, "password" varchar, "resetPasswordGuid" varchar, "recoveryLinkExpirationDate" date, "userType" integer NOT NULL DEFAULT (1), "plexId" integer, "plexToken" varchar, "permissions" integer NOT NULL DEFAULT (0), "avatar" varchar NOT NULL, "movieQuotaLimit" integer, "movieQuotaDays" integer, "tvQuotaLimit" integer, "tvQuotaDays" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"))`
    );
    await queryRunner.query(
      `CREATE TABLE "media_request" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "status" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "type" varchar NOT NULL, "is4k" boolean NOT NULL DEFAULT (0), "serverId" integer, "profileId" integer, "rootFolder" varchar, "languageProfileId" integer, "tags" text, "isAutoRequest" boolean NOT NULL DEFAULT (0), "mediaId" integer, "requestedById" integer, "modifiedById" integer)`
    );
    await queryRunner.query(
      `CREATE TABLE "season" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "seasonNumber" integer NOT NULL, "status" integer NOT NULL DEFAULT (1), "status4k" integer NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "mediaId" integer)`
    );
    await queryRunner.query(
      `CREATE TABLE "media" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "mediaType" varchar NOT NULL, "tmdbId" integer NOT NULL, "tvdbId" integer, "imdbId" varchar, "status" integer NOT NULL DEFAULT (1), "status4k" integer NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "lastSeasonChange" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "mediaAddedAt" datetime, "serviceId" integer, "serviceId4k" integer, "externalServiceId" integer, "externalServiceId4k" integer, "externalServiceSlug" varchar, "externalServiceSlug4k" varchar, "ratingKey" varchar, "ratingKey4k" varchar, CONSTRAINT "UQ_41a289eb1fa489c1bc6f38d9c3c" UNIQUE ("tvdbId"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7157aad07c73f6a6ae3bbd5ef5" ON "media" ("tmdbId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_41a289eb1fa489c1bc6f38d9c3" ON "media" ("tvdbId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7ff2d11f6a83cb52386eaebe74" ON "media" ("imdbId") `
    );
    await queryRunner.query(
      `CREATE TABLE "issue" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "issueType" integer NOT NULL, "status" integer NOT NULL DEFAULT (1), "problemSeason" integer NOT NULL DEFAULT (0), "problemEpisode" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "mediaId" integer, "createdById" integer, "modifiedById" integer)`
    );
    await queryRunner.query(
      `CREATE TABLE "issue_comment" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "message" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "userId" integer, "issueId" integer)`
    );
    await queryRunner.query(
      `CREATE TABLE "discover_slider" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" integer NOT NULL, "order" integer NOT NULL, "isBuiltIn" boolean NOT NULL DEFAULT (0), "enabled" boolean NOT NULL DEFAULT (1), "title" varchar, "data" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`
    );
    await queryRunner.query(
      `CREATE TABLE "session" ("expiredAt" bigint NOT NULL, "id" varchar(255) PRIMARY KEY NOT NULL, "json" text NOT NULL)`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_28c5d1d16da7908c97c9bc2f74" ON "session" ("expiredAt") `
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_season_request" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "seasonNumber" integer NOT NULL, "status" integer NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "requestId" integer, CONSTRAINT "FK_6f14737e346d6b27d8e50d2157a" FOREIGN KEY ("requestId") REFERENCES "media_request" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_season_request"("id", "seasonNumber", "status", "createdAt", "updatedAt", "requestId") SELECT "id", "seasonNumber", "status", "createdAt", "updatedAt", "requestId" FROM "season_request"`
    );
    await queryRunner.query(`DROP TABLE "season_request"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_season_request" RENAME TO "season_request"`
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_user_push_subscription" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "endpoint" varchar NOT NULL, "p256dh" varchar NOT NULL, "auth" varchar NOT NULL, "userId" integer, CONSTRAINT "UQ_f90ab5a4ed54905a4bb51a7148b" UNIQUE ("auth"), CONSTRAINT "FK_03f7958328e311761b0de675fbe" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_user_push_subscription"("id", "endpoint", "p256dh", "auth", "userId") SELECT "id", "endpoint", "p256dh", "auth", "userId" FROM "user_push_subscription"`
    );
    await queryRunner.query(`DROP TABLE "user_push_subscription"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_user_push_subscription" RENAME TO "user_push_subscription"`
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_user_settings" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "locale" varchar NOT NULL DEFAULT (''), "region" varchar, "originalLanguage" varchar, "pgpKey" varchar, "discordId" varchar, "pushbulletAccessToken" varchar, "pushoverApplicationToken" varchar, "pushoverUserKey" varchar, "pushoverSound" varchar, "telegramChatId" varchar, "telegramSendSilently" boolean, "watchlistSyncMovies" boolean, "watchlistSyncTv" boolean, "collapseTags" boolean, "notificationTypes" text, "userId" integer, CONSTRAINT "REL_986a2b6d3c05eb4091bb8066f7" UNIQUE ("userId"), CONSTRAINT "FK_986a2b6d3c05eb4091bb8066f78" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_user_settings"("id", "locale", "region", "originalLanguage", "pgpKey", "discordId", "pushbulletAccessToken", "pushoverApplicationToken", "pushoverUserKey", "pushoverSound", "telegramChatId", "telegramSendSilently", "watchlistSyncMovies", "watchlistSyncTv", "collapseTags", "notificationTypes", "userId") SELECT "id", "locale", "region", "originalLanguage", "pgpKey", "discordId", "pushbulletAccessToken", "pushoverApplicationToken", "pushoverUserKey", "pushoverSound", "telegramChatId", "telegramSendSilently", "watchlistSyncMovies", "watchlistSyncTv", "collapseTags", "notificationTypes", "userId" FROM "user_settings"`
    );
    await queryRunner.query(`DROP TABLE "user_settings"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_user_settings" RENAME TO "user_settings"`
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_media_request" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "status" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "type" varchar NOT NULL, "is4k" boolean NOT NULL DEFAULT (0), "serverId" integer, "profileId" integer, "rootFolder" varchar, "languageProfileId" integer, "tags" text, "isAutoRequest" boolean NOT NULL DEFAULT (0), "mediaId" integer, "requestedById" integer, "modifiedById" integer, CONSTRAINT "FK_a1aa713f41c99e9d10c48da75a0" FOREIGN KEY ("mediaId") REFERENCES "media" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_6997bee94720f1ecb7f31137095" FOREIGN KEY ("requestedById") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_f4fc4efa14c3ba2b29c4525fa15" FOREIGN KEY ("modifiedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_media_request"("id", "status", "createdAt", "updatedAt", "type", "is4k", "serverId", "profileId", "rootFolder", "languageProfileId", "tags", "isAutoRequest", "mediaId", "requestedById", "modifiedById") SELECT "id", "status", "createdAt", "updatedAt", "type", "is4k", "serverId", "profileId", "rootFolder", "languageProfileId", "tags", "isAutoRequest", "mediaId", "requestedById", "modifiedById" FROM "media_request"`
    );
    await queryRunner.query(`DROP TABLE "media_request"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_media_request" RENAME TO "media_request"`
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_season" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "seasonNumber" integer NOT NULL, "status" integer NOT NULL DEFAULT (1), "status4k" integer NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "mediaId" integer, CONSTRAINT "FK_087099b39600be695591da9a49c" FOREIGN KEY ("mediaId") REFERENCES "media" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_season"("id", "seasonNumber", "status", "status4k", "createdAt", "updatedAt", "mediaId") SELECT "id", "seasonNumber", "status", "status4k", "createdAt", "updatedAt", "mediaId" FROM "season"`
    );
    await queryRunner.query(`DROP TABLE "season"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_season" RENAME TO "season"`
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_issue" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "issueType" integer NOT NULL, "status" integer NOT NULL DEFAULT (1), "problemSeason" integer NOT NULL DEFAULT (0), "problemEpisode" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "mediaId" integer, "createdById" integer, "modifiedById" integer, CONSTRAINT "FK_276e20d053f3cff1645803c95d8" FOREIGN KEY ("mediaId") REFERENCES "media" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_10b17b49d1ee77e7184216001e0" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_da88a1019c850d1a7b143ca02e5" FOREIGN KEY ("modifiedById") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_issue"("id", "issueType", "status", "problemSeason", "problemEpisode", "createdAt", "updatedAt", "mediaId", "createdById", "modifiedById") SELECT "id", "issueType", "status", "problemSeason", "problemEpisode", "createdAt", "updatedAt", "mediaId", "createdById", "modifiedById" FROM "issue"`
    );
    await queryRunner.query(`DROP TABLE "issue"`);
    await queryRunner.query(`ALTER TABLE "temporary_issue" RENAME TO "issue"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_issue_comment" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "message" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "userId" integer, "issueId" integer, CONSTRAINT "FK_707b033c2d0653f75213614789d" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_180710fead1c94ca499c57a7d42" FOREIGN KEY ("issueId") REFERENCES "issue" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_issue_comment"("id", "message", "createdAt", "updatedAt", "userId", "issueId") SELECT "id", "message", "createdAt", "updatedAt", "userId", "issueId" FROM "issue_comment"`
    );
    await queryRunner.query(`DROP TABLE "issue_comment"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_issue_comment" RENAME TO "issue_comment"`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "issue_comment" RENAME TO "temporary_issue_comment"`
    );
    await queryRunner.query(
      `CREATE TABLE "issue_comment" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "message" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "userId" integer, "issueId" integer)`
    );
    await queryRunner.query(
      `INSERT INTO "issue_comment"("id", "message", "createdAt", "updatedAt", "userId", "issueId") SELECT "id", "message", "createdAt", "updatedAt", "userId", "issueId" FROM "temporary_issue_comment"`
    );
    await queryRunner.query(`DROP TABLE "temporary_issue_comment"`);
    await queryRunner.query(`ALTER TABLE "issue" RENAME TO "temporary_issue"`);
    await queryRunner.query(
      `CREATE TABLE "issue" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "issueType" integer NOT NULL, "status" integer NOT NULL DEFAULT (1), "problemSeason" integer NOT NULL DEFAULT (0), "problemEpisode" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "mediaId" integer, "createdById" integer, "modifiedById" integer)`
    );
    await queryRunner.query(
      `INSERT INTO "issue"("id", "issueType", "status", "problemSeason", "problemEpisode", "createdAt", "updatedAt", "mediaId", "createdById", "modifiedById") SELECT "id", "issueType", "status", "problemSeason", "problemEpisode", "createdAt", "updatedAt", "mediaId", "createdById", "modifiedById" FROM "temporary_issue"`
    );
    await queryRunner.query(`DROP TABLE "temporary_issue"`);
    await queryRunner.query(
      `ALTER TABLE "season" RENAME TO "temporary_season"`
    );
    await queryRunner.query(
      `CREATE TABLE "season" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "seasonNumber" integer NOT NULL, "status" integer NOT NULL DEFAULT (1), "status4k" integer NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "mediaId" integer)`
    );
    await queryRunner.query(
      `INSERT INTO "season"("id", "seasonNumber", "status", "status4k", "createdAt", "updatedAt", "mediaId") SELECT "id", "seasonNumber", "status", "status4k", "createdAt", "updatedAt", "mediaId" FROM "temporary_season"`
    );
    await queryRunner.query(`DROP TABLE "temporary_season"`);
    await queryRunner.query(
      `ALTER TABLE "media_request" RENAME TO "temporary_media_request"`
    );
    await queryRunner.query(
      `CREATE TABLE "media_request" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "status" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "type" varchar NOT NULL, "is4k" boolean NOT NULL DEFAULT (0), "serverId" integer, "profileId" integer, "rootFolder" varchar, "languageProfileId" integer, "tags" text, "isAutoRequest" boolean NOT NULL DEFAULT (0), "mediaId" integer, "requestedById" integer, "modifiedById" integer)`
    );
    await queryRunner.query(
      `INSERT INTO "media_request"("id", "status", "createdAt", "updatedAt", "type", "is4k", "serverId", "profileId", "rootFolder", "languageProfileId", "tags", "isAutoRequest", "mediaId", "requestedById", "modifiedById") SELECT "id", "status", "createdAt", "updatedAt", "type", "is4k", "serverId", "profileId", "rootFolder", "languageProfileId", "tags", "isAutoRequest", "mediaId", "requestedById", "modifiedById" FROM "temporary_media_request"`
    );
    await queryRunner.query(`DROP TABLE "temporary_media_request"`);
    await queryRunner.query(
      `ALTER TABLE "user_settings" RENAME TO "temporary_user_settings"`
    );
    await queryRunner.query(
      `CREATE TABLE "user_settings" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "locale" varchar NOT NULL DEFAULT (''), "region" varchar, "originalLanguage" varchar, "pgpKey" varchar, "discordId" varchar, "pushbulletAccessToken" varchar, "pushoverApplicationToken" varchar, "pushoverUserKey" varchar, "pushoverSound" varchar, "telegramChatId" varchar, "telegramSendSilently" boolean, "watchlistSyncMovies" boolean, "watchlistSyncTv" boolean, "collapseTags" boolean, "notificationTypes" text, "userId" integer, CONSTRAINT "REL_986a2b6d3c05eb4091bb8066f7" UNIQUE ("userId"))`
    );
    await queryRunner.query(
      `INSERT INTO "user_settings"("id", "locale", "region", "originalLanguage", "pgpKey", "discordId", "pushbulletAccessToken", "pushoverApplicationToken", "pushoverUserKey", "pushoverSound", "telegramChatId", "telegramSendSilently", "watchlistSyncMovies", "watchlistSyncTv", "collapseTags", "notificationTypes", "userId") SELECT "id", "locale", "region", "originalLanguage", "pgpKey", "discordId", "pushbulletAccessToken", "pushoverApplicationToken", "pushoverUserKey", "pushoverSound", "telegramChatId", "telegramSendSilently", "watchlistSyncMovies", "watchlistSyncTv", "collapseTags", "notificationTypes", "userId" FROM "temporary_user_settings"`
    );
    await queryRunner.query(`DROP TABLE "temporary_user_settings"`);
    await queryRunner.query(
      `ALTER TABLE "user_push_subscription" RENAME TO "temporary_user_push_subscription"`
    );
    await queryRunner.query(
      `CREATE TABLE "user_push_subscription" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "endpoint" varchar NOT NULL, "p256dh" varchar NOT NULL, "auth" varchar NOT NULL, "userId" integer, CONSTRAINT "UQ_f90ab5a4ed54905a4bb51a7148b" UNIQUE ("auth"))`
    );
    await queryRunner.query(
      `INSERT INTO "user_push_subscription"("id", "endpoint", "p256dh", "auth", "userId") SELECT "id", "endpoint", "p256dh", "auth", "userId" FROM "temporary_user_push_subscription"`
    );
    await queryRunner.query(`DROP TABLE "temporary_user_push_subscription"`);
    await queryRunner.query(
      `ALTER TABLE "season_request" RENAME TO "temporary_season_request"`
    );
    await queryRunner.query(
      `CREATE TABLE "season_request" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "seasonNumber" integer NOT NULL, "status" integer NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "requestId" integer)`
    );
    await queryRunner.query(
      `INSERT INTO "season_request"("id", "seasonNumber", "status", "createdAt", "updatedAt", "requestId") SELECT "id", "seasonNumber", "status", "createdAt", "updatedAt", "requestId" FROM "temporary_season_request"`
    );
    await queryRunner.query(`DROP TABLE "temporary_season_request"`);
    await queryRunner.query(`DROP INDEX "IDX_28c5d1d16da7908c97c9bc2f74"`);
    await queryRunner.query(`DROP TABLE "session"`);
    await queryRunner.query(`DROP TABLE "discover_slider"`);
    await queryRunner.query(`DROP TABLE "issue_comment"`);
    await queryRunner.query(`DROP TABLE "issue"`);
    await queryRunner.query(`DROP INDEX "IDX_7ff2d11f6a83cb52386eaebe74"`);
    await queryRunner.query(`DROP INDEX "IDX_41a289eb1fa489c1bc6f38d9c3"`);
    await queryRunner.query(`DROP INDEX "IDX_7157aad07c73f6a6ae3bbd5ef5"`);
    await queryRunner.query(`DROP TABLE "media"`);
    await queryRunner.query(`DROP TABLE "season"`);
    await queryRunner.query(`DROP TABLE "media_request"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "user_settings"`);
    await queryRunner.query(`DROP TABLE "user_push_subscription"`);
    await queryRunner.query(`DROP TABLE "season_request"`);
  }
}
