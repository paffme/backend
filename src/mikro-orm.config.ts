import { Options } from 'mikro-orm';
import { User } from './user/user.entity';
import { BaseEntity } from './shared/base.entity';
import { ConfigurationService } from './shared/configuration/configuration.service';
import { Competition } from './competition/competition.entity';
import { CompetitionRegistration } from './shared/entity/competition-registration.entity';
import { Timestamp } from './shared/entity/timestamp.entity';
import { BoulderingRound } from './bouldering/bouldering-round.entity';
import { BoulderingResult } from './bouldering/bouldering-result.entity';
import { Boulder } from './bouldering/boulder.entity';
const configService = new ConfigurationService();

const config: Options = {
  type: 'postgresql',
  host: 'localhost',
  port: 5432,
  user: configService.get('POSTGRESQL_USER'),
  password: configService.get('POSTGRESQL_PASSWORD'),
  dbName: configService.get('POSTGRESQL_DATABASE'),
  entities: [
    Timestamp,
    BaseEntity,
    User,
    Competition,
    CompetitionRegistration,
    BoulderingRound,
    BoulderingResult,
    Boulder,
  ],
  entitiesDirsTs: ['src'],
};

export default config;
