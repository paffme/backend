import { Entity, ManyToOne } from 'mikro-orm';
import { Competition } from '../../competition/competition.entity';
import { User } from '../../user/user.entity';
import { Timestamp } from './timestamp.entity';

@Entity()
export class CompetitionRegistration extends Timestamp {
  @ManyToOne({ primary: true })
  competition: Competition;

  @ManyToOne({ primary: true })
  climber: User;

  constructor(competition: Competition, climber: User) {
    super();
    this.competition = competition;
    this.climber = climber;
  }
}
