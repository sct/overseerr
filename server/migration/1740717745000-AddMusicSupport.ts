import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMusicSupport1740717745000 implements MigrationInterface {
  name = 'AddMusicSupport1740717745000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add musicBrainzId column
    await queryRunner.query(
      `ALTER TABLE "media" ADD COLUMN "musicBrainzId" varchar`
    );

    // Make tmdbId nullable (music doesn't use TMDB)
    // Note: We need to specify column names explicitly to avoid column order issues
    await queryRunner.query(
      `CREATE TABLE "temporary_media" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "mediaType" varchar NOT NULL,
        "tmdbId" integer,
        "tvdbId" integer,
        "imdbId" varchar,
        "musicBrainzId" varchar,
        "status" integer NOT NULL DEFAULT (1),
        "status4k" integer NOT NULL DEFAULT (1),
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        "lastSeasonChange" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        "mediaAddedAt" datetime,
        "serviceId" integer,
        "serviceId4k" integer,
        "externalServiceId" integer,
        "externalServiceId4k" integer,
        "externalServiceSlug" varchar,
        "externalServiceSlug4k" varchar,
        "ratingKey" varchar,
        "ratingKey4k" varchar,
        CONSTRAINT "UQ_41a289eb1fa489c1bc6f38d9c3c" UNIQUE ("tvdbId")
      )`
    );

    // Use explicit column names to ensure correct data mapping regardless of column order
    await queryRunner.query(
      `INSERT INTO "temporary_media" ("id", "mediaType", "tmdbId", "tvdbId", "imdbId", "musicBrainzId", "status", "status4k", "createdAt", "updatedAt", "lastSeasonChange", "mediaAddedAt", "serviceId", "serviceId4k", "externalServiceId", "externalServiceId4k", "externalServiceSlug", "externalServiceSlug4k", "ratingKey", "ratingKey4k") 
       SELECT "id", "mediaType", "tmdbId", "tvdbId", "imdbId", "musicBrainzId", "status", "status4k", "createdAt", "updatedAt", "lastSeasonChange", "mediaAddedAt", "serviceId", "serviceId4k", "externalServiceId", "externalServiceId4k", "externalServiceSlug", "externalServiceSlug4k", "ratingKey", "ratingKey4k" FROM "media"`
    );

    await queryRunner.query(`DROP TABLE "media"`);
    await queryRunner.query(`ALTER TABLE "temporary_media" RENAME TO "media"`);

    // Recreate indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_7157aad07c73f6a6ae3bbd5ef5" ON "media" ("tmdbId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_41a289eb1fa489c1bc6f38d9c3" ON "media" ("tvdbId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7ff2d11f6a83cb52386eaebe74" ON "media" ("imdbId")`
    );

    // Add index for musicBrainzId
    await queryRunner.query(
      `CREATE INDEX "IDX_musicbrainz_id" ON "media" ("musicBrainzId")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_musicbrainz_id"`);
    await queryRunner.query(`DROP INDEX "IDX_7ff2d11f6a83cb52386eaebe74"`);
    await queryRunner.query(`DROP INDEX "IDX_41a289eb1fa489c1bc6f38d9c3"`);
    await queryRunner.query(`DROP INDEX "IDX_7157aad07c73f6a6ae3bbd5ef5"`);

    await queryRunner.query(`ALTER TABLE "media" RENAME TO "temporary_media"`);

    await queryRunner.query(
      `CREATE TABLE "media" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "mediaType" varchar NOT NULL,
        "tmdbId" integer NOT NULL,
        "tvdbId" integer,
        "imdbId" varchar,
        "status" integer NOT NULL DEFAULT (1),
        "status4k" integer NOT NULL DEFAULT (1),
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        "lastSeasonChange" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        "mediaAddedAt" datetime,
        "serviceId" integer,
        "serviceId4k" integer,
        "externalServiceId" integer,
        "externalServiceId4k" integer,
        "externalServiceSlug" varchar,
        "externalServiceSlug4k" varchar,
        "ratingKey" varchar,
        "ratingKey4k" varchar,
        CONSTRAINT "UQ_41a289eb1fa489c1bc6f38d9c3c" UNIQUE ("tvdbId")
      )`
    );

    await queryRunner.query(
      `INSERT INTO "media" ("id", "mediaType", "tmdbId", "tvdbId", "imdbId", "status", "status4k", "createdAt", "updatedAt", "lastSeasonChange", "mediaAddedAt", "serviceId", "serviceId4k", "externalServiceId", "externalServiceId4k", "externalServiceSlug", "externalServiceSlug4k", "ratingKey", "ratingKey4k") SELECT "id", "mediaType", "tmdbId", "tvdbId", "imdbId", "status", "status4k", "createdAt", "updatedAt", "lastSeasonChange", "mediaAddedAt", "serviceId", "serviceId4k", "externalServiceId", "externalServiceId4k", "externalServiceSlug", "externalServiceSlug4k", "ratingKey", "ratingKey4k" FROM "temporary_media"`
    );

    await queryRunner.query(`DROP TABLE "temporary_media"`);

    await queryRunner.query(
      `CREATE INDEX "IDX_7157aad07c73f6a6ae3bbd5ef5" ON "media" ("tmdbId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_41a289eb1fa489c1bc6f38d9c3" ON "media" ("tvdbId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7ff2d11f6a83cb52386eaebe74" ON "media" ("imdbId")`
    );
  }
}
