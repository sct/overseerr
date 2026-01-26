import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditLog1769470000000 implements MigrationInterface {
  name = 'AddAuditLog1769470000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "audit_log" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "action" varchar NOT NULL, "entityType" varchar, "entityId" varchar, "ip" varchar, "meta" text, "userId" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_audit_log_user" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_log_action" ON "audit_log" ("action")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_log_createdAt" ON "audit_log" ("createdAt")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_audit_log_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_audit_log_action"`);
    await queryRunner.query(`DROP TABLE "audit_log"`);
  }
}

