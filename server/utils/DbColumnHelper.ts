import type { ColumnOptions, ColumnType } from 'typeorm';
import { Column } from 'typeorm';

export const isPostgres = process.env.DB_TYPE === 'postgres';

const pgTypeMapping: { [key: string]: ColumnType } = {
  datetime: 'timestamp with time zone',
};

export function resolveDbType(pgType: ColumnType): ColumnType {
  if (isPostgres && pgType.toString() in pgTypeMapping) {
    return pgTypeMapping[pgType.toString()];
  }
  return pgType;
}

export function DbAwareColumn(columnOptions: ColumnOptions) {
  if (columnOptions.type) {
    columnOptions.type = resolveDbType(columnOptions.type);
  }
  return Column(columnOptions);
}
