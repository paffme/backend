import { Injectable } from '@nestjs/common';
import { InjectRepository } from 'nestjs-mikro-orm';
import { EntityRepository, wrap } from 'mikro-orm';
import { BoulderingResult } from '../result/bouldering-result.entity';
import { Competition } from '../../competition/competition.entity';
import { CreateBoulderingResultDto } from '../../competition/dto/in/body/create-bouldering-result.dto';
import { CreateBoulderingRoundDto } from '../../competition/dto/in/body/create-bouldering-round.dto';
import { User } from '../../user/user.entity';
import { Boulder } from '../boulder/boulder.entity';
import { BoulderService } from '../boulder/boulder.service';
import { BoulderingGroupService } from '../group/bouldering-group.service';
import { CreateBoulderDto } from '../../competition/dto/in/body/create-boulder.dto';
import { CreateBoulderingGroupDto } from '../../competition/dto/in/body/create-bouldering-group.dto';
import { CompetitionRoundType } from '../../competition/competition-round-type.enum';
import { UpdateBoulderingRoundDto } from '../../competition/dto/in/body/update-bouldering-round.dto';
import { RoundNotFoundError } from '../errors/round-not-found.error';
import { InvalidRoundError } from '../errors/invalid-round.error';
import { RoundTypeConflictError } from '../errors/round-type-conflict.error';
import { GroupNotFoundError } from '../errors/group-not-found.error';
import { MaxClimbersReachedError } from '../errors/max-climbers-reached.error';
import { BulkBoulderingResultsDto } from '../../competition/dto/in/body/bulk-bouldering-results.dto';
import { RankingsNotFoundError } from '../../competition/errors/rankings-not-found.error';
import { EventEmitter as EE } from 'ee-ts';

import {
  getRankingDiff,
  RankingDiffInput,
  RankingsDiff,
} from '../ranking/ranking.utils';

import {
  RoundQuotaConfig,
  RoundQuotaConfigValue,
} from '../../../config/round-quota';

import {
  BoulderingRound,
  BoulderingRoundRankings,
  BoulderingRoundRankingsStandalone,
  BoulderingRoundRankingType,
  BoulderingRoundRelation,
} from './bouldering-round.entity';

import {
  BoulderingGroup,
  BoulderingGroupRankings,
} from '../group/bouldering-group.entity';

export interface BoulderingRoundRankingsUpdateEventPayload {
  roundId: typeof BoulderingRound.prototype.id;
  rankings: BoulderingRoundRankings;
  diff: RankingsDiff[];
}

export interface BoulderingRoundServiceEvents {
  rankingsUpdate(payload: BoulderingRoundRankingsUpdateEventPayload): void;
}

@Injectable()
export class BoulderingRoundService extends EE<BoulderingRoundServiceEvents> {
  constructor(
    @InjectRepository(BoulderingRound)
    private readonly boulderingRoundRepository: EntityRepository<
      BoulderingRound
    >,
    private readonly boulderService: BoulderService,
    private readonly boulderingGroupService: BoulderingGroupService,
  ) {
    super();
  }

  async getOrFail(
    roundId: typeof BoulderingRound.prototype.id,
    populate?: BoulderingRoundRelation[],
  ): Promise<BoulderingRound> {
    const round = await this.boulderingRoundRepository.findOne(
      roundId,
      populate,
    );

    if (!round) {
      throw new RoundNotFoundError();
    }

    return round;
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  async createRound(
    competition: Competition,
    dto: CreateBoulderingRoundDto,
  ): Promise<BoulderingRound> {
    if (
      (dto.type === CompetitionRoundType.SEMI_FINAL ||
        dto.type === CompetitionRoundType.FINAL) &&
      dto.rankingType !== BoulderingRoundRankingType.CIRCUIT
    ) {
      throw new InvalidRoundError(
        "Can't create a non circuit round for a semi final or final",
      );
    }

    if (dto.rankingType === BoulderingRoundRankingType.LIMITED_CONTEST) {
      if (typeof dto.maxTries !== 'number') {
        throw new InvalidRoundError(
          'maxTries is mandatory for a limited contest',
        );
      }
    } else if (typeof dto.maxTries === 'number') {
      throw new InvalidRoundError(
        'maxTries should not be defined for an non limited contest',
      );
    }

    const groups = dto.groups ?? 1;

    if (groups > 1) {
      if (dto.type !== CompetitionRoundType.QUALIFIER) {
        throw new InvalidRoundError(
          'No more than one group for a non qualifier round',
        );
      }

      if (dto.rankingType !== BoulderingRoundRankingType.CIRCUIT) {
        throw new InvalidRoundError(
          'No more than one group for a non circuit round',
        );
      }
    }

    const rounds = competition.boulderingRounds
      .getItems()
      .filter(
        (round) => round.category === dto.category && round.sex === dto.sex,
      );

    if (rounds.length >= 3) {
      throw new InvalidRoundError(
        'You cannot create more than 3 rounds for a category',
      );
    }

    // Verify round type uniqueness
    const roundWithTypeExists = rounds.some((r) => r.type === dto.type);

    if (roundWithTypeExists) {
      throw new RoundTypeConflictError(dto.type);
    }

    const round = new BoulderingRound(
      dto.category,
      dto.sex,
      dto.name,
      dto.maxTries,
      dto.rankingType,
      dto.type,
      competition,
    );

    // Create groups
    for (let i = 0; i < groups; i++) {
      // FIXME: this is a transaction and should be flushed underneath
      const group = await this.boulderingGroupService.create(`${i}`, round);
      await this.boulderService.createMany(group, dto.boulders);
    }

    // Add registrations if this is the qualifiers
    if (round.type === CompetitionRoundType.QUALIFIER) {
      const season = competition.getSeason();
      const registrations = await competition.registrations.init({
        populate: ['climber'],
      });

      const climbersRegistered = registrations
        .getItems()
        .map((r) => r.climber)
        .filter((c) => {
          const category = c.getCategory(season);
          return category.name === round.category && category.sex === round.sex;
        });

      await this.addClimbers(round, ...climbersRegistered);
    }

    await this.boulderingRoundRepository.persistAndFlush(round);
    return round;
  }

  private mergeGroupRankings(round: BoulderingRound): BoulderingRoundRankings {
    const mergedRankings: BoulderingRoundRankings = {
      type: round.rankingType,
      rankings: [],
    };

    for (const group of round.groups.getItems()) {
      if (group.rankings) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        mergedRankings.rankings.push(...group.rankings.rankings);
      }
    }

    return mergedRankings;
  }

  private mapRankingsForDiff(
    rankings: BoulderingRoundRankingsStandalone,
  ): RankingDiffInput[] {
    return rankings.map((r) => ({
      climberId: r.climber.id,
      ranking: r.ranking,
    }));
  }

  async updateRoundRankings(round: BoulderingRound): Promise<void> {
    const oldRankings = round.rankings;
    round.rankings = this.mergeGroupRankings(round);

    this.emit('rankingsUpdate', {
      roundId: round.id,
      rankings: round.rankings,
      diff: getRankingDiff(
        oldRankings ? this.mapRankingsForDiff(oldRankings.rankings) : [],
        this.mapRankingsForDiff(round.rankings.rankings),
      ),
    });

    await this.boulderingRoundRepository.persistAndFlush(round);
  }

  async addResult(
    roundId: typeof BoulderingRound.prototype.id,
    groupId: typeof BoulderingGroup.prototype.id,
    boulderId: typeof Boulder.prototype.id,
    climber: User,
    dto: CreateBoulderingResultDto,
  ): Promise<BoulderingResult> {
    const [round, boulder] = await Promise.all([
      this.getOrFail(roundId, ['groups']),
      this.boulderService.getOrFail(boulderId),
    ]);

    const group = round.groups.getItems().find((g) => g.id === groupId);

    if (!group) {
      throw new GroupNotFoundError();
    }

    const result = await this.boulderingGroupService.addResult(
      group,
      boulder,
      climber,
      dto,
    );

    await this.updateRoundRankings(round);
    return result;
  }

  async addClimbers(
    round: BoulderingRound,
    ...climbers: User[]
  ): Promise<void> {
    if (!round.takesNewClimbers()) {
      throw new MaxClimbersReachedError();
    }

    const season = round.competition.getSeason();
    const groups = round.groups.getItems();
    let currentGroupIndex = 0;

    if (groups.length > 1) {
      currentGroupIndex =
        groups[0].climbers.count() > groups[1].climbers.count() ? 1 : 0;
    }

    for (let i = 0; i < climbers.length; i++) {
      const climber = climbers[i];
      const climberCategory = climber.getCategory(season);

      if (
        round.category === climberCategory.name &&
        round.sex === climberCategory.sex
      ) {
        groups[currentGroupIndex].climbers.add(climber);
        currentGroupIndex = (currentGroupIndex + 1) % groups.length;
      } else {
        throw new InvalidRoundError('This round is not handling this category');
      }
    }

    const totalClimbers = groups.reduce(
      (acc, g) => acc + g.climbers.count(),
      0,
    );

    if (round.type !== CompetitionRoundType.FINAL) {
      round.quota = this.computeQuota(totalClimbers, round.type);
    }

    await this.boulderingRoundRepository.persistAndFlush(round);
  }

  private computeQuota(
    climbers: number,
    roundType: CompetitionRoundType.QUALIFIER | CompetitionRoundType.SEMI_FINAL,
  ): number {
    let quota: RoundQuotaConfigValue | undefined;

    if (climbers < 3) {
      quota = RoundQuotaConfig.get(3);
    } else if (climbers > 30) {
      quota = RoundQuotaConfig.get(30);
    } else {
      quota = RoundQuotaConfig.get(climbers);
    }

    if (!quota) {
      return 0;
    }

    return quota[roundType];
  }

  private async getGroupOrFail(
    round: BoulderingRound,
    groupId: typeof BoulderingGroup.prototype.id,
  ): Promise<BoulderingGroup> {
    const groups = await round.groups.init({
      where: {
        id: groupId,
      },
    });

    const group = groups.getItems()[0];

    if (!group) {
      throw new GroupNotFoundError();
    }

    return group;
  }

  async createBoulder(
    round: BoulderingRound,
    groupId: typeof BoulderingGroup.prototype.id,
    dto: CreateBoulderDto,
  ): Promise<Boulder> {
    const group = await this.getGroupOrFail(round, groupId);
    return this.boulderService.create(group, dto);
  }

  async removeBoulder(
    round: BoulderingRound,
    groupId: typeof BoulderingGroup.prototype.id,
    boulderId: typeof Boulder.prototype.id,
  ): Promise<void> {
    const group = await this.getGroupOrFail(round, groupId);
    return this.boulderService.remove(group, boulderId);
  }

  async createGroup(
    round: BoulderingRound,
    dto: CreateBoulderingGroupDto,
  ): Promise<BoulderingGroup> {
    return this.boulderingGroupService.create(dto.name, round);
  }

  async deleteGroup(
    round: BoulderingRound,
    groupId: typeof BoulderingGroup.prototype.id,
  ): Promise<void> {
    const group = await this.getGroupOrFail(round, groupId);
    // FIXME: cascade remove does not yet works
    await this.boulderService.deleteMany(group.boulders);
    return this.boulderingGroupService.delete(group);
  }

  async delete(round: BoulderingRound): Promise<void> {
    const groups = await round.groups.init();

    for (const g of groups.getItems()) {
      // FIXME: cascade remove does not yet works
      this.boulderingRoundRepository.removeLater(g);
      // FIXME: cascade remove does not yet works
      await this.boulderService.deleteMany(g.boulders);
    }

    return this.boulderingRoundRepository.removeAndFlush(round);
  }

  async update(
    competition: Competition,
    round: BoulderingRound,
    dto: UpdateBoulderingRoundDto,
  ): Promise<BoulderingRound> {
    const otherRounds = competition.boulderingRounds
      .getItems()
      .filter((r) => r !== round);

    if (dto.type) {
      const roundWithTypeExists = otherRounds.some((r) => r.type === dto.type);

      if (roundWithTypeExists) {
        throw new RoundTypeConflictError(dto.type);
      }
    }

    wrap(round).assign(dto);
    await this.boulderingRoundRepository.persistAndFlush(round);
    return round;
  }

  async assignJudgeToBoulder(
    round: BoulderingRound,
    groupId: typeof BoulderingGroup.prototype.id,
    boulderId: typeof Boulder.prototype.id,
    judgeId: typeof User.prototype.id,
  ): Promise<void> {
    const group = await this.getGroupOrFail(round, groupId);

    await this.boulderingGroupService.assignJudgeToBoulder(
      group,
      boulderId,
      judgeId,
    );
  }

  async removeJudgeAssignmentToBoulder(
    round: BoulderingRound,
    groupId: typeof BoulderingGroup.prototype.id,
    boulderId: typeof Boulder.prototype.id,
    judgeId: typeof User.prototype.id,
  ): Promise<void> {
    const group = await this.getGroupOrFail(round, groupId);

    await this.boulderingGroupService.removeJudgeAssignmentToBoulder(
      group,
      boulderId,
      judgeId,
    );
  }

  async getGroupBoulders(
    round: BoulderingRound,
    groupId: typeof BoulderingGroup.prototype.id,
  ): Promise<Boulder[]> {
    const group = await this.getGroupOrFail(round, groupId);
    return this.boulderingGroupService.getBoulders(group);
  }

  async bulkGroupResults(
    round: BoulderingRound,
    groupId: typeof BoulderingGroup.prototype.id,
    dto: BulkBoulderingResultsDto,
  ): Promise<BoulderingGroupRankings> {
    const group = await this.getGroupOrFail(round, groupId);
    const groupRankings = await this.boulderingGroupService.bulkResults(
      group,
      dto,
    );

    await this.updateRoundRankings(round);
    return groupRankings;
  }

  async getGroupRankings(
    round: BoulderingRound,
    groupId: typeof BoulderingGroup.prototype.id,
  ): Promise<BoulderingGroupRankings> {
    const group = await this.getGroupOrFail(round, groupId);

    if (typeof group.rankings === 'undefined') {
      throw new RankingsNotFoundError();
    }

    return group.rankings;
  }

  async getBoulderingResult(
    round: BoulderingRound,
    groupId: typeof BoulderingGroup.prototype.id,
    boulderId: typeof Boulder.prototype.id,
    climber: User,
  ): Promise<BoulderingResult> {
    const group = await this.getGroupOrFail(round, groupId);

    return this.boulderingGroupService.getBoulderingResult(
      group,
      boulderId,
      climber,
    );
  }
}
