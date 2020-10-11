const devConfig = {
  type: 'sqlite',
  database: 'config/db/db.sqlite3',
  synchronize: true,
  logging: false,
  entities: ['server/entity/**/*.ts'],
  migrations: ['server/migration/**/*.ts'],
  cli: {
    entitiesDir: 'server/entity',
    migrationsDir: 'server/migration',
  },
};

const prodConfig = {
  type: 'sqlite',
  database: 'config/db/db.sqlite3',
  synchronize: false,
  logging: false,
  entities: ['dist/entity/**/*.js'],
  migrations: ['dist/migration/**/*.js'],
  migrationsRun: true,
  cli: {
    entitiesDir: 'dist/entity',
    migrationsDir: 'dist/migration',
  },
};

const finalConfig =
  process.env.NODE_ENV !== 'production' ? devConfig : prodConfig;

module.exports = finalConfig;
