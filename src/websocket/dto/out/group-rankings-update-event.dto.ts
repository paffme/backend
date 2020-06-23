import { BoulderingGroup } from '../../../bouldering/group/bouldering-group.entity';
import { RankingsDiff } from '../../../bouldering/ranking/ranking.utils';
import { BoulderingGroupRankingsUpdateEventPayload } from '../../../bouldering/group/bouldering-group.service';

export class GroupRankingsUpdateEventDto {
  groupId: typeof BoulderingGroup.prototype.id;
  rankings: typeof BoulderingGroup.prototype.rankings;
  diff: RankingsDiff[];

  constructor(payload: BoulderingGroupRankingsUpdateEventPayload) {
    this.groupId = payload.groupId;
    this.rankings = payload.rankings;
    this.diff = payload.diff;
  }
}
