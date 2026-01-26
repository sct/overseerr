import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApiKeys1769470500000 implements MigrationInterface {
  name = 'AddApiKeys1769470500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "api_key" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "keyHash" varchar NOT NULL, "last4" varchar NOT NULL, "permissions" integer NOT NULL DEFAULT (0), "isActive" boolean NOT NULL DEFAULT (1), "lastUsedAt" datetime, "userId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_api_key_keyHash" UNIQUE ("keyHash"), CONSTRAINT "FK_api_key_user" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_api_key_userId" ON "api_key" ("userId")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_api_key_userId"`);
    await queryRunner.query(`DROP TABLE "api_key"`);
  }
}

