import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHideTagsColumn1710274992992 implements MigrationInterface {
  name = 'AddHideTagsColumn1710274992992';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "temporary_user_settings" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "locale" varchar NOT NULL DEFAULT (''), "region" varchar, "originalLanguage" varchar, "pgpKey" varchar, "discordId" varchar, "pushbulletAccessToken" varchar, "pushoverApplicationToken" varchar, "pushoverUserKey" varchar, "pushoverSound" varchar, "telegramChatId" varchar, "telegramSendSilently" boolean, "watchlistSyncMovies" boolean, "watchlistSyncTv" boolean, "notificationTypes" text, "userId" integer, "hideTags" boolean, CONSTRAINT "REL_986a2b6d3c05eb4091bb8066f7" UNIQUE ("userId"), CONSTRAINT "FK_986a2b6d3c05eb4091bb8066f78" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_user_settings"("id", "locale", "region", "originalLanguage", "pgpKey", "discordId", "pushbulletAccessToken", "pushoverApplicationToken", "pushoverUserKey", "pushoverSound", "telegramChatId", "telegramSendSilently", "watchlistSyncMovies", "watchlistSyncTv", "notificationTypes", "userId") SELECT "id", "locale", "region", "originalLanguage", "pgpKey", "discordId", "pushbulletAccessToken", "pushoverApplicationToken", "pushoverUserKey", "pushoverSound", "telegramChatId", "telegramSendSilently", "watchlistSyncMovies", "watchlistSyncTv", "notificationTypes", "userId" FROM "user_settings"`
    );
    await queryRunner.query(`DROP TABLE "user_settings"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_user_settings" RENAME TO "user_settings"`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_settings" RENAME TO "temporary_user_settings"`
    );
    await queryRunner.query(
      `CREATE TABLE "user_settings" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "locale" varchar NOT NULL DEFAULT (''), "region" varchar, "originalLanguage" varchar, "pgpKey" varchar, "discordId" varchar, "pushbulletAccessToken" varchar, "pushoverApplicationToken" varchar, "pushoverUserKey" varchar, "pushoverSound" varchar, "telegramChatId" varchar, "telegramSendSilently" boolean, "watchlistSyncMovies" boolean, "watchlistSyncTv" boolean, "notificationTypes" text, "userId" integer, CONSTRAINT "REL_986a2b6d3c05eb4091bb8066f7" UNIQUE ("userId"), CONSTRAINT "FK_986a2b6d3c05eb4091bb8066f78" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "user_settings"("id", "locale", "region", "originalLanguage", "pgpKey", "discordId", "pushbulletAccessToken", "pushoverApplicationToken", "pushoverUserKey", "pushoverSound", "telegramChatId", "telegramSendSilently", "watchlistSyncMovies", "watchlistSyncTv", "notificationTypes", "userId") SELECT "id", "locale", "region", "originalLanguage", "pgpKey", "discordId", "pushbulletAccessToken", "pushoverApplicationToken", "pushoverUserKey", "pushoverSound", "telegramChatId", "telegramSendSilently", "watchlistSyncMovies", "watchlistSyncTv", "notificationTypes", "userId" FROM "temporary_user_settings"`
    );
    await queryRunner.query(`DROP TABLE "temporary_user_settings"`);
  }
}
