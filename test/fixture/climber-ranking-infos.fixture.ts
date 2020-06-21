import * as uuid from 'uuid';
import { ClimberRankingInfos } from '../../src/competition/types/climber-ranking-infos.interface';

export function givenClimberRankingInfos(id: number): ClimberRankingInfos {
  return {
    id,
    firstName: uuid.v4(),
    lastName: uuid.v4(),
    club: uuid.v4(),
  };
}
