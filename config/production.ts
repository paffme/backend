import { Config } from './config.interface';
import * as path from 'path';
const env = process.env;

const config: Config = {
  BASE_API_URL: 'https://paffme.hdaroit.fr/api/v1',
  BOULDER_STORAGE_PATH: path.resolve(env.HOME as string, './storage/boulders'),
  BOULDER_STORAGE_URL: 'https://paffme.hdaroit.fr/storage/boulders',
  HOST: '0.0.0.0',
  PORT: 4000,
  JWT_SECRET: env.JWT_SECRET as string,
  JWT_ALGORITHM: 'HS256',
  JWT_EXPIRATION: '12h',
  JWT_ISSUER: 'paffme.hdaroit.fr',
  POSTGRESQL_USER: env.POSTGRESQL_USER as string,
  POSTGRESQL_PASSWORD: env.POSTGRESQL_PASSWORD as string,
  POSTGRESQL_DATABASE: env.POSTGRESQL_DATABASE as string,
  REDIS_HOST: process.env.REDIS_HOST as string,
  REDIS_PORT: process.env.REDIS_PORT as string,
  REDIS_PREFIX: process.env.REDIS_PREFIX as string,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD as string,
};

export default config;
