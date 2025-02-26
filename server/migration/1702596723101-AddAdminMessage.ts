import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminMessage1702596723101 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE media_requests
        ADD adminMessage VARCHAR(140)
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE media_requests
        DROP COLUMN adminMessage
      `);
  }
}
