import {
  Entity,
  IdentifiedReference,
  ManyToOne,
  PrimaryKeyType,
  Reference,
} from 'mikro-orm';
import { Competition } from '../../competition/competition.entity';
import { User } from '../../user/user.entity';
import { Timestamp } from './timestamp.entity';

@Entity()
export class CompetitionRegistration extends Timestamp {
  @ManyToOne({ primary: true })
  competition: IdentifiedReference<Competition>;

  @ManyToOne({ primary: true })
  climber: IdentifiedReference<User>;

  [PrimaryKeyType]: [number, number];

  constructor(competition: Competition, climber: User) {
    super();
    this.competition = Reference.create(competition);
    this.climber = Reference.create(climber);
  }
}
