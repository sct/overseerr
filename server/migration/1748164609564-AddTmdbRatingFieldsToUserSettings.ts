import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTmdbRatingFieldsToUserSettings1748164609564
  implements MigrationInterface
{
  name = 'AddTmdbRatingFieldsToUserSettings1748164609564';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_settings" ADD "movieTmdbMinRating" real`
    );
    await queryRunner.query(
      `ALTER TABLE "user_settings" ADD "movieTmdbMaxRating" real`
    );
    await queryRunner.query(
      `ALTER TABLE "user_settings" ADD "movieTmdb4kMinRating" real`
    );
    await queryRunner.query(
      `ALTER TABLE "user_settings" ADD "movieTmdb4kMaxRating" real`
    );
    await queryRunner.query(
      `ALTER TABLE "user_settings" ADD "tvTmdbMinRating" real`
    );
    await queryRunner.query(
      `ALTER TABLE "user_settings" ADD "tvTmdbMaxRating" real`
    );
    await queryRunner.query(
      `ALTER TABLE "user_settings" ADD "tvTmdb4kMinRating" real`
    );
    await queryRunner.query(
      `ALTER TABLE "user_settings" ADD "tvTmdb4kMaxRating" real`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_settings" DROP COLUMN "tvTmdb4kMaxRating"`
    );
    await queryRunner.query(
      `ALTER TABLE "user_settings" DROP COLUMN "tvTmdb4kMinRating"`
    );
    await queryRunner.query(
      `ALTER TABLE "user_settings" DROP COLUMN "tvTmdbMaxRating"`
    );
    await queryRunner.query(
      `ALTER TABLE "user_settings" DROP COLUMN "tvTmdbMinRating"`
    );
    await queryRunner.query(
      `ALTER TABLE "user_settings" DROP COLUMN "movieTmdb4kMaxRating"`
    );
    await queryRunner.query(
      `ALTER TABLE "user_settings" DROP COLUMN "movieTmdb4kMinRating"`
    );
    await queryRunner.query(
      `ALTER TABLE "user_settings" DROP COLUMN "movieTmdbMaxRating"`
    );
    await queryRunner.query(
      `ALTER TABLE "user_settings" DROP COLUMN "movieTmdbMinRating"`
    );
  }
}
