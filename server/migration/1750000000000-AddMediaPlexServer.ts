import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMediaPlexServer1750000000000 implements MigrationInterface {
  name = 'AddMediaPlexServer1750000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the media_plex_server table
    await queryRunner.query(
      `CREATE TABLE "media_plex_server" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "plexServerId" integer NOT NULL,
        "ratingKey" varchar,
        "ratingKey4k" varchar,
        "mediaId" integer,
        CONSTRAINT "FK_media_plex_server_media" FOREIGN KEY ("mediaId") REFERENCES "media" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )`
    );

    // Create index on plexServerId for faster lookups
    await queryRunner.query(
      `CREATE INDEX "IDX_media_plex_server_plexServerId" ON "media_plex_server" ("plexServerId")`
    );

    // Migrate existing ratingKey data from media table to media_plex_server
    // This assumes the old single server had id = 0
    await queryRunner.query(
      `INSERT INTO "media_plex_server" ("plexServerId", "ratingKey", "ratingKey4k", "mediaId")
       SELECT 0, "ratingKey", "ratingKey4k", "id"
       FROM "media"
       WHERE "ratingKey" IS NOT NULL OR "ratingKey4k" IS NOT NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the index
    await queryRunner.query(`DROP INDEX "IDX_media_plex_server_plexServerId"`);

    // Drop the table
    await queryRunner.query(`DROP TABLE "media_plex_server"`);
  }
}
