import { Config } from './config.interface';
import * as path from 'path';

const config: Config = {
  BASE_API_URL: 'http://localhost:3000',
  BOULDER_STORAGE_PATH: path.resolve(__dirname, '../assets/boulders'),
  BOULDER_STORAGE_URL: 'http://localhost:3000/storage/boulders',
  HOST: '0.0.0.0',
  PORT: 3000,
  JWT_SECRET:
    'vFP8CTP9svUPYHD/rBnzdh2kTDxj3ZllnvsYGTo1oz7QL0e2y3NuEejHFO/Gzp5d+HHgHHXD9twTo0Rj5ssQrwRxVieANBLkIxkAhTFPAHJPGXbtJZvfIS2b64SQFkFY7GIWrIhRvc6XHuFlPi+RtmvNmze/8AwwowL4/q32mrQF/xqOszS82DJL94GjB1HNOvw8W+oPL9XIHBzZB00eBjgKnVN0oYcRXL9JQPThyTTx1ArTCVbpnQHNXcCDjgUyxVO7kfU7sTJIwWFJrLmodpgwLBNaYgkSMSzWN+3HGP9QfielN2VmIrKSWAZGVePtx8DLk39cvaqjOAFbXrdROg==',
  JWT_ALGORITHM: 'HS256',
  JWT_EXPIRATION: '12h',
  JWT_ISSUER: 'paffme.com',
  POSTGRESQL_USER: 'paffme',
  POSTGRESQL_PASSWORD: 'paffme',
  POSTGRESQL_DATABASE: 'paffme',
  REDIS_HOST: 'localhost',
  REDIS_PORT: '6379',
  REDIS_PREFIX: 'apaffme',
  REDIS_PASSWORD: '',
  HOLDS_RECOGNITION_SCRIPT_PATH: path.resolve(
    __dirname,
    '../test/fixture/detection.py',
  ),
  HOLDS_RECOGNITION_TMP_STORAGE_PATH: '/tmp',
  HOLDS_RECOGNITION_WEIGHTS_PATH: '_',
};

export default config;
