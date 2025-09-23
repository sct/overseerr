import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEpisodeRequest1758255809000 implements MigrationInterface {
  name = 'AddEpisodeRequest1758255809000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "episode_request" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "seasonNumber" integer NOT NULL, "episodeNumber" integer NOT NULL, "status" integer NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "requestId" integer, CONSTRAINT "FK_episode_request_media_request" FOREIGN KEY ("requestId") REFERENCES "media_request" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_episode_request_season_episode" ON "episode_request" ("seasonNumber", "episodeNumber", "requestId")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_episode_request_season_episode"`);
    await queryRunner.query(`DROP TABLE "episode_request"`);
  }
}
