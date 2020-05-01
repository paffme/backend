import { Config } from './config.interface';
const env = process.env;

const config: Config = {
  BASE_API_URL: 'https://paffme.hdaroit.fr/api/v1',
  HOST: '0.0.0.0',
  PORT: 4000,
  JWT_SECRET: env.JWT_SECRET as string,
  JWT_ALGORITHM: 'HS256',
  JWT_EXPIRATION: '1h',
  JWT_ISSUER: 'paffme.hdaroit.fr',
  POSTGRESQL_USER: env.POSTGRESQL_USER as string,
  POSTGRESQL_PASSWORD: env.POSTGRESQL_PASSWORD as string,
  POSTGRESQL_DATABASE: env.POSTGRESQL_DATABASE as string,
};

export default config;
