import type { MigrationInterface, QueryRunner } from "typeorm";
import { TableColumn, Table } from "typeorm";

export class AddLastActiveToUser1702596723102 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add the new column "lastActive" to the "user" table.
    await queryRunner.addColumn(
      "user",
      new TableColumn({
        name: "lastActive",
        type: "timestamp",  // This works in SQLite even though SQLite doesn’t have a native TIMESTAMP type.
        isNullable: true,   // Allows the column to be null.
        default: null,      // Default value is null.
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      // Attempt to drop the column directly.
      await queryRunner.dropColumn("user", "lastActive");
    } catch (error) {
      // If direct drop fails (e.g., in older SQLite versions), we recreate the table without "lastActive".
      const table = await queryRunner.getTable("user");
      if (table) {
        // Filter out the "lastActive" column from the existing columns.
        const newColumns = table.columns.filter(col => col.name !== "lastActive");

        // Create a temporary table with the same columns except "lastActive".
        await queryRunner.createTable(
          new Table({
            name: "temporary_user",
            columns: newColumns.map(col =>
              new TableColumn({
                name: col.name,
                type: col.type,
                isNullable: col.isNullable,
                isPrimary: col.isPrimary,
                isUnique: col.isUnique,
                default: col.default,
                length: col.length,
              })
            ),
          })
        );

        // Copy data from the old table into the temporary table.
        const columnNames = newColumns.map(col => `"${col.name}"`).join(", ");
        await queryRunner.query(
          `INSERT INTO "temporary_user" (${columnNames}) SELECT ${columnNames} FROM "user"`
        );

        // Drop the old table.
        await queryRunner.dropTable("user");

        // Rename the temporary table to "user".
        await queryRunner.renameTable("temporary_user", "user");
      }
    }
  }
}
