import { RankingsDiff } from '../../../bouldering/ranking/ranking.utils';
import { CompetitionRankingsUpdateEventPayload } from '../../../competition/competition.service';
import { Category } from '../../../shared/types/category.interface';

import {
  ClimberRanking,
  Competition,
} from '../../../competition/competition.entity';

export class CompetitionRankingsUpdateEventDto {
  competitionId: typeof Competition.prototype.id;
  rankings: ClimberRanking[];
  diff: RankingsDiff[];
  category: Category;

  constructor(payload: CompetitionRankingsUpdateEventPayload) {
    this.competitionId = payload.competitionId;
    this.rankings = payload.rankings;
    this.diff = payload.diff;
    this.category = payload.category;
  }
}
