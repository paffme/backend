import { Config } from './config.interface';

const config: Config = {
  BASE_API_URL: 'http://localhost:3000',
  HOST: '0.0.0.0',
  PORT: 3000,
  JWT_SECRET:
    'vFP8CTP9svUPYHD/rBnzdh2kTDxj3ZllnvsYGTo1oz7QL0e2y3NuEejHFO/Gzp5d+HHgHHXD9twTo0Rj5ssQrwRxVieANBLkIxkAhTFPAHJPGXbtJZvfIS2b64SQFkFY7GIWrIhRvc6XHuFlPi+RtmvNmze/8AwwowL4/q32mrQF/xqOszS82DJL94GjB1HNOvw8W+oPL9XIHBzZB00eBjgKnVN0oYcRXL9JQPThyTTx1ArTCVbpnQHNXcCDjgUyxVO7kfU7sTJIwWFJrLmodpgwLBNaYgkSMSzWN+3HGP9QfielN2VmIrKSWAZGVePtx8DLk39cvaqjOAFbXrdROg==',
  JWT_ALGORITHM: 'HS256',
  JWT_EXPIRATION: '1h',
  JWT_ISSUER: 'paffme.com',
  POSTGRESQL_USER: 'paffme',
  POSTGRESQL_PASSWORD: 'paffme',
  POSTGRESQL_DATABASE: 'paffme',
};

export default config;
