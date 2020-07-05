import { Injectable } from '@nestjs/common';
import { InjectRepository } from 'nestjs-mikro-orm';
import { EntityRepository } from 'mikro-orm';
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
import { EventEmitter as EE } from 'ee-ts';
import { promises as fs } from 'fs';
import * as path from 'path';

import {
  BoulderingGroup,
  BoulderingGroupRankings,
  BoulderingGroupRankingsStandalone,
  BoulderingGroupState,
} from './bouldering-group.entity';

import {
  BoulderingRound,
  BoulderingRoundRankingType,
} from '../round/bouldering-round.entity';

import {
  getRankingDiff,
  RankingDiffInput,
  RankingsDiff,
} from '../ranking/ranking.utils';

export interface BoulderingGroupRankingsUpdateEventPayload {
  groupId: typeof BoulderingGroup.prototype.id;
  rankings: BoulderingGroupRankings;
  diff: RankingsDiff[];
}

export interface BoulderingGroupServiceEvents {
  rankingsUpdate(payload: BoulderingGroupRankingsUpdateEventPayload): void;
}

@Injectable()
export class BoulderingGroupService extends EE<BoulderingGroupServiceEvents> {
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
  ) {
    super();
  }

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

  private mapRankingsForDiff(
    rankings: BoulderingGroupRankingsStandalone,
  ): RankingDiffInput[] {
    return rankings.map((r) => ({
      climberId: r.climber.id,
      ranking: r.ranking,
    }));
  }

  private async updateRankings(group: BoulderingGroup): Promise<void> {
    await group.results.init();
    const oldRankings = group.rankings;

    group.rankings = this.rankingServices[group.round.rankingType].getRankings(
      group,
    );

    this.emit('rankingsUpdate', {
      groupId: group.id,
      rankings: group.rankings,
      diff: getRankingDiff(
        oldRankings ? this.mapRankingsForDiff(oldRankings.rankings) : [],
        this.mapRankingsForDiff(group.rankings.rankings),
      ),
    });

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

  async getBoulderingResult(
    group: BoulderingGroup,
    boulderId: typeof Boulder.prototype.id,
    climber: User,
  ): Promise<BoulderingResult> {
    const boulder = await this.getBoulderInGroupOrFail(group, boulderId);
    return this.boulderingResultService.getOrFail(group, boulder, climber);
  }

  async uploadBoulderPhoto(
    group: BoulderingGroup,
    boulderId: typeof Boulder.prototype.id,
    photo: Buffer,
    extension: string,
  ): Promise<void> {
    const boulder = await this.getBoulderInGroupOrFail(group, boulderId);
    await this.boulderService.uploadPhoto(boulder, photo, extension);
  }

  async deleteBoulderPhoto(
    group: BoulderingGroup,
    boulderId: typeof Boulder.prototype.id,
  ): Promise<void> {
    const boulder = await this.getBoulderInGroupOrFail(group, boulderId);
    await this.boulderService.removePhoto(boulder);
  }

  getBoulder(
    group: BoulderingGroup,
    boulderId: typeof Boulder.prototype.id,
  ): Promise<Boulder> {
    return this.getBoulderInGroupOrFail(group, boulderId);
  }

  async updateState(
    groups: BoulderingGroup[],
    state: BoulderingGroupState,
  ): Promise<void> {
    for (const group of groups) {
      group.state = state;
      this.boulderingGroupRepository.persistLater(group);
    }

    await this.boulderingGroupRepository.flush();
  }
}
