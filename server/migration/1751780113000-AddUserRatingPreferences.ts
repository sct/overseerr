import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRatingPreferences1751780113000 implements MigrationInterface {
  name = 'AddUserRatingPreferences1751780113000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_settings" ADD "maxMovieRating" varchar`
    );
    await queryRunner.query(
      `ALTER TABLE "user_settings" ADD "maxTvRating" varchar`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_settings" DROP COLUMN "maxTvRating"`
    );
    await queryRunner.query(
      `ALTER TABLE "user_settings" DROP COLUMN "maxMovieRating"`
    );
  }
}
