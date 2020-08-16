const devConfig = {
  type: 'sqlite',
  database: 'db/db.sqlite3',
  synchronize: true,
  logging: true,
  entities: ['src/entity/**/*.ts'],
  migrations: ['src/migration/**/*.ts'],
  cli: {
    entitiesDir: 'src/entity',
    migrationsDir: 'src/migration',
  },
};

const prodConfig = {
  type: 'sqlite',
  database: 'db/db.sqlite3',
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
