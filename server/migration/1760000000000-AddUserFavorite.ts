import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserFavorite1760000000000 implements MigrationInterface {
    name = 'AddUserFavorite1760000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "user_favorite" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "tmdbId" integer NOT NULL, "mediaType" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "userId" integer, CONSTRAINT "FK_user_favorite_user" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_user_favorite_unique" ON "user_favorite" ("userId", "tmdbId", "mediaType")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_user_favorite_unique"`);
        await queryRunner.query(`DROP TABLE "user_favorite"`);
    }
}


