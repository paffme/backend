import { Injectable } from '@nestjs/common';
import { InjectRepository } from 'nestjs-mikro-orm';
import { EntityRepository, wrap } from 'mikro-orm';
import {
  BoulderingRound,
  BoulderingRoundRankingType,
  BoulderingRoundRelation,
} from './bouldering-round.entity';
import { BoulderingResult } from '../result/bouldering-result.entity';
import { Competition } from '../../competition/competition.entity';
import { CreateBoulderingResultDto } from '../../competition/dto/in/body/create-bouldering-result.dto';
import { BoulderingResultService } from '../result/bouldering-result.service';
import { CreateBoulderingRoundDto } from '../../competition/dto/in/body/create-bouldering-round.dto';
import { User } from '../../user/user.entity';
import { Boulder } from '../boulder/boulder.entity';
import { BoulderService } from '../boulder/boulder.service';
import { BoulderingRoundUnlimitedContestRankingService } from './ranking/bouldering-round-unlimited-contest-ranking.service';
import { BoulderingRoundRankingService } from './ranking/bouldering-round-ranking.service';
import { BoulderingRoundCountedRankingService } from './ranking/bouldering-round-counted-ranking.service';
import { BoulderingGroupService } from '../group/bouldering-group.service';
import { BoulderingGroup } from '../group/bouldering-group.entity';
import { CreateBoulderDto } from '../../competition/dto/in/body/create-boulder.dto';
import { CreateBoulderingGroupDto } from '../../competition/dto/in/body/create-bouldering-group.dto';
import { CompetitionRoundType } from '../../competition/competition-round-type.enum';
import { UpdateBoulderingRoundDto } from '../../competition/dto/in/body/update-bouldering-round.dto';
import { RoundNotFoundError } from '../errors/round-not-found.error';
import { InvalidRoundError } from '../errors/invalid-round.error';
import { RoundTypeConflictError } from '../errors/round-type-conflict.error';
import { GroupNotFoundError } from '../errors/group-not-found.error';
import { ClimberNotInRoundError } from '../errors/climber-not-in-round.error';
import { BoulderNotInRoundError } from '../errors/boulder-not-in-round.error';
import { MaxClimbersReachedError } from '../errors/max-climbers-reached.error';

@Injectable()
export class BoulderingRoundService {
  private readonly rankingServices: {
    [key in BoulderingRoundRankingType]: BoulderingRoundRankingService;
  } = {
    [BoulderingRoundRankingType.UNLIMITED_CONTEST]: this
      .boulderingUnlimitedContestRankingService,
    [BoulderingRoundRankingType.LIMITED_CONTEST]: this
      .boulderingRoundCountedTriesRankingService,
    [BoulderingRoundRankingType.CIRCUIT]: this
      .boulderingRoundCountedTriesRankingService,
  };

  constructor(
    @InjectRepository(BoulderingRound)
    private readonly boulderingRoundRepository: EntityRepository<
      BoulderingRound
    >,
    private readonly boulderingResultService: BoulderingResultService,
    private readonly boulderService: BoulderService,
    private readonly boulderingUnlimitedContestRankingService: BoulderingRoundUnlimitedContestRankingService,
    private readonly boulderingRoundCountedTriesRankingService: BoulderingRoundCountedRankingService,
    private readonly boulderingGroupService: BoulderingGroupService,
  ) {}

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

    if (
      dto.rankingType === BoulderingRoundRankingType.LIMITED_CONTEST &&
      typeof dto.maxTries !== 'number'
    ) {
      throw new InvalidRoundError(
        'maxTries is mandatory for a limited contest',
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
      dto.quota,
      dto.rankingType,
      dto.type,
      competition,
    );

    // Create groups
    for (let i = 0; i < groups; i++) {
      const group = await this.boulderingGroupService.create(`${i}`, round);
      await this.boulderService.createMany(group, dto.boulders);
    }

    // Add registrations if this is the qualfiers
    if (round.type === CompetitionRoundType.QUALIFIER) {
      const registrations = competition.registrations.getItems();
      const climbersRegistered = registrations.map((r) => r.climber);
      await this.addClimbers(round, ...climbersRegistered);
    }

    await this.boulderingRoundRepository.persistAndFlush(round);

    return round;
  }

  async updateRankings(round: BoulderingRound): Promise<void> {
    round.rankings = this.rankingServices[round.rankingType].getRankings(round);
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

    await Promise.all([
      group.climbers.init(),
      group.boulders.init(),
      group.results.init(),
    ]);

    if (!group.climbers.contains(climber)) {
      throw new ClimberNotInRoundError();
    }

    if (!group.boulders.contains(boulder)) {
      throw new BoulderNotInRoundError();
    }

    const result = await this.boulderingResultService.addResult(
      group,
      boulder,
      climber,
      dto,
    );

    await this.updateRankings(round);

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

    await this.boulderingRoundRepository.persistAndFlush(round);
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
}
