import { Options } from 'mikro-orm';
import { User } from './user/user.entity';
import { BaseEntity } from './shared/base.entity';
import { ConfigurationService } from './shared/configuration/configuration.service';
import { Competition } from './competition/competition.entity';
const configService = new ConfigurationService();

const config: Options = {
  type: 'postgresql',
  host: 'localhost',
  port: 5432,
  user: configService.get('POSTGRESQL_USER'),
  password: configService.get('POSTGRESQL_PASSWORD'),
  dbName: configService.get('POSTGRESQL_DATABASE'),
  entities: [BaseEntity, User, Competition],
  entitiesDirsTs: ['src'],
};

export default config;
