import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFavoriteStatusFields1672041273675 implements MigrationInterface {
  name = 'AddFavoriteStatusFields1672041273675';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "media" ADD "isFavorite" BOOLEAN DEFAULT FALSE`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "media" DROP COLUMN "isFavorite"`
    );
  }
}
