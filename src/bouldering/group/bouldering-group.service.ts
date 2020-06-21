import { Injectable } from '@nestjs/common';
import { InjectRepository } from 'nestjs-mikro-orm';
import { EntityRepository } from 'mikro-orm';
import {
  BoulderingGroup,
  BoulderingGroupRankings,
} from './bouldering-group.entity';
import {
  BoulderingRound,
  BoulderingRoundRankingType,
} from '../round/bouldering-round.entity';
import { GroupNameConflictError } from '../errors/group-name-conflict.error';
import { Boulder } from '../boulder/boulder.entity';
import { User } from '../../user/user.entity';
import { BoulderService } from '../boulder/boulder.service';
import { BoulderNotFoundError } from '../errors/boulder-not-found.error';
import { BoulderingGroupRankingService } from './ranking/bouldering-group-ranking.service';
import { BoulderingGroupUnlimitedContestRankingService } from './ranking/bouldering-group-unlimited-contest-ranking.service';
import { BoulderingGroupCircuitRankingService } from './ranking/bouldering-group-circuit-ranking.service';
import { CreateBoulderingResultDto } from '../../competition/dto/in/body/create-bouldering-result.dto';
import { BoulderingResultService } from '../result/bouldering-result.service';
import { BoulderingResult } from '../result/bouldering-result.entity';
import { BulkBoulderingResultsDto } from '../../competition/dto/in/body/bulk-bouldering-results.dto';

@Injectable()
export class BoulderingGroupService {
  private readonly rankingServices: {
    [key in BoulderingRoundRankingType]: BoulderingGroupRankingService;
  } = {
    [BoulderingRoundRankingType.UNLIMITED_CONTEST]: this
      .boulderingUnlimitedContestRankingService,
    [BoulderingRoundRankingType.LIMITED_CONTEST]: this
      .boulderingRoundCountedTriesRankingService,
    [BoulderingRoundRankingType.CIRCUIT]: this
      .boulderingRoundCountedTriesRankingService,
  };

  constructor(
    @InjectRepository(BoulderingGroup)
    private readonly boulderingGroupRepository: EntityRepository<
      BoulderingGroup
    >,
    private readonly boulderService: BoulderService,
    private readonly boulderingUnlimitedContestRankingService: BoulderingGroupUnlimitedContestRankingService,
    private readonly boulderingRoundCountedTriesRankingService: BoulderingGroupCircuitRankingService,
    private readonly boulderingResultService: BoulderingResultService,
  ) {}

  private async getBoulderInGroupOrFail(
    group: BoulderingGroup,
    boulderId: typeof Boulder.prototype.id,
  ): Promise<Boulder> {
    const boulders = await group.boulders.init({
      where: {
        id: boulderId,
      },
    });

    const boulder = boulders.getItems()[0];

    if (!boulder) {
      throw new BoulderNotFoundError();
    }

    return boulder;
  }

  private async updateRankings(group: BoulderingGroup): Promise<void> {
    await group.results.init();

    group.rankings = this.rankingServices[group.round.rankingType].getRankings(
      group,
    );

    await this.boulderingGroupRepository.persistAndFlush(group);
  }

  async addResult(
    group: BoulderingGroup,
    boulder: Boulder,
    climber: User,
    dto: CreateBoulderingResultDto,
  ): Promise<BoulderingResult> {
    const result = await this.boulderingResultService.addResult(
      group,
      boulder,
      climber,
      dto,
    );

    await this.updateRankings(group);
    return result;
  }

  async bulkResults(
    group: BoulderingGroup,
    dto: BulkBoulderingResultsDto,
  ): Promise<BoulderingGroupRankings> {
    await this.boulderingResultService.bulkResults(group, dto);
    await this.updateRankings(group);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return group.rankings!;
  }

  async create(name: string, round: BoulderingRound): Promise<BoulderingGroup> {
    const count = await this.boulderingGroupRepository.count({
      round,
      name,
    });

    if (count > 0) {
      throw new GroupNameConflictError();
    }

    const group = new BoulderingGroup(name, round);
    await this.boulderingGroupRepository.persistAndFlush(group);
    return group;
  }

  delete(group: BoulderingGroup): Promise<void> {
    return this.boulderingGroupRepository.removeAndFlush(group);
  }

  async assignJudgeToBoulder(
    group: BoulderingGroup,
    boulderId: typeof Boulder.prototype.id,
    judgeId: typeof User.prototype.id,
  ): Promise<void> {
    const boulder = await this.getBoulderInGroupOrFail(group, boulderId);
    await this.boulderService.assignJudge(boulder, judgeId);
  }

  async removeJudgeAssignmentToBoulder(
    group: BoulderingGroup,
    boulderId: typeof Boulder.prototype.id,
    judgeId: typeof User.prototype.id,
  ): Promise<void> {
    const boulder = await this.getBoulderInGroupOrFail(group, boulderId);
    await this.boulderService.removeJudgeAssignment(boulder, judgeId);
  }

  async getBoulders(group: BoulderingGroup): Promise<Boulder[]> {
    const collection = await group.boulders.init(['judges']);
    return collection.getItems();
  }
}
