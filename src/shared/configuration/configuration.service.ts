import { Injectable } from '@nestjs/common';
import { get } from 'config';
import { Config } from '../../../config/config.interface';

@Injectable()
export class ConfigurationService {
  private environmentHosting: string = process.env.NODE_ENV || 'development';

  get<ConfigKey extends keyof Config>(configKey: ConfigKey): Config[ConfigKey] {
    return get(configKey);
  }

  get isDevelopment(): boolean {
    return this.environmentHosting === 'development';
  }
}
