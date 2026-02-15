import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDeclineReasonTable1740717744280
  implements MigrationInterface
{
  name = 'CreateDeclineReasonTable1740717744280';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "decline_reason" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "reason" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`
    );

    // Insert default decline reasons
    await queryRunner.query(`
      INSERT INTO "decline_reason" ("reason") VALUES 
      ('Inappropriate content'),
      ('Low quality content'),
      ('Not available - too niche'),
      ('Please request only a few seasons at a time'),
      ('Available on YouTube'),
      ('No reality TV sorry')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "decline_reason"`);
  }
}
