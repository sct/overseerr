import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserPlexServerName1750000000002 implements MigrationInterface {
  name = 'AddUserPlexServerName1750000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN "plexServerName" varchar`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "plexServerName"`);
  }
}

