import { Algorithm } from 'jsonwebtoken';

export interface Config {
  BASE_API_URL: string;
  HOST: string;
  PORT: number;
  JWT_SECRET: string;
  JWT_ALGORITHM: Algorithm;
  JWT_EXPIRATION: string;
  JWT_ISSUER: string;
  POSTGRESQL_USER: string;
  POSTGRESQL_PASSWORD: string;
  POSTGRESQL_DATABASE: string;
  REDIS_HOST: string;
  REDIS_PORT: string;
  REDIS_PREFIX: string;
  REDIS_PASSWORD: string;
  BOULDER_STORAGE_PATH: string;
  BOULDER_STORAGE_URL: string;
  HOLDS_RECOGNITION_WEIGHTS_PATH: string;
  HOLDS_RECOGNITION_SCRIPT_PATH: string;
  HOLDS_RECOGNITION_TMP_STORAGE_PATH: string;
}
