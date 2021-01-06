import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserType1609808314229 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD "userType" INT NOT NULL`);
    await queryRunner.query(`UPDATE "user" SET "userType" = 1`);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "userType"`);
  }
}
