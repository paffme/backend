import { Options } from 'mikro-orm';
import { User } from './user/user.entity';
import { BaseEntity } from './shared/base.entity';
const env = process.env;

const config = {
  type: 'postgresql',
  host: 'localhost',
  port: 5432,
  username: env.POSTGRESQL_USER,
  password: env.POSTGRESQL_PASSWORD,
  dbName: env.POSTGRESQL_DATABASE,
  entities: [BaseEntity, User],
  entitiesDirsTs: ['src'],
} as Options;

export default config;
