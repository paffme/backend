const env = process.env;

export default {
  name: 'Postgre',
  connector: 'postgresql',
  url: '',
  host: 'localhost',
  port: 5432,
  user: env.POSTGRESQL_USER,
  password: env.POSTGRESQL_PASSWORD,
  database: env.POSTGRESQL_DATABASE,
};
