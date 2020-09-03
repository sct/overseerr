const devConfig = {
  type: 'sqlite',
  database: 'config/db/db.sqlite3',
  synchronize: true,
  logging: true,
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
  entities: ['dist/server/entity/**/*.js'],
  migrations: ['dist/server/migration/**/*.js'],
  migrationsRun: true,
  cli: {
    entitiesDir: 'dist/server/entity',
    migrationsDir: 'dist/server/migration',
  },
};

const finalConfig =
  process.env.NODE_ENV !== 'production' ? devConfig : prodConfig;

module.exports = finalConfig;
