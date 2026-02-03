import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMusicQuotaToUser1740717745002 implements MigrationInterface {
  name = 'AddMusicQuotaToUser1740717745002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN "musicQuotaLimit" integer`
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN "musicQuotaDays" integer`
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async down(queryRunner: QueryRunner): Promise<void> {
    // SQLite doesn't support DROP COLUMN - rollback not implemented
  }
}
