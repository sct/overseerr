import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserPlexServerId1750000000001 implements MigrationInterface {
  name = 'AddUserPlexServerId1750000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN "plexServerId" integer`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "plexServerId"`);
  }
}

