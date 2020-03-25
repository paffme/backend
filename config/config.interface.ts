import { Algorithm } from 'jsonwebtoken';

export interface Config {
  HOST: string;
  PORT: number;
  JWT_SECRET: string;
  JWT_ALGORITHM: Algorithm;
  JWT_EXPIRATION: string;
  JWT_ISSUER: string;
  POSTGRESQL_USER: string;
  POSTGRESQL_PASSWORD: string;
  POSTGRESQL_DATABASE: string;
}
