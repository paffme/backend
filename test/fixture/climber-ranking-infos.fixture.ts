import { ClimberRankingInfos } from '../../src/bouldering/round/bouldering-round.entity';
import * as uuid from 'uuid';

export function givenClimberRankingInfos(id: number): ClimberRankingInfos {
  return {
    id,
    firstName: uuid.v4(),
    lastName: uuid.v4(),
    club: uuid.v4(),
  };
}
