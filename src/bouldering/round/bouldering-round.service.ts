import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from 'nestjs-mikro-orm';
import { EntityRepository } from 'mikro-orm';
import {
  BoulderingRound,
  BoulderingRoundRankingType,
  BoulderingRoundRelation,
  BoulderingRoundType,
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
      throw new NotFoundException('Round not found');
    }

    return round;
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  async createRound(
    competition: Competition,
    dto: CreateBoulderingRoundDto,
  ): Promise<BoulderingRound> {
    if (
      (dto.type === BoulderingRoundType.SEMI_FINAL ||
        dto.type === BoulderingRoundType.FINAL) &&
      dto.rankingType !== BoulderingRoundRankingType.CIRCUIT
    ) {
      throw new UnprocessableEntityException(
        "Can't create a non circuit round for a semi final or final",
      );
    }

    const groups = dto.groups ?? 1;

    if (groups > 1) {
      if (dto.type !== BoulderingRoundType.QUALIFIER) {
        throw new UnprocessableEntityException(
          'No more than one group for a non qualifier round',
        );
      }

      if (dto.rankingType !== BoulderingRoundRankingType.CIRCUIT) {
        throw new UnprocessableEntityException(
          'No more than one group for a non circuit round',
        );
      }
    }

    const rounds = competition.boulderingRounds
      .getItems()
      .filter(
        (round) => round.category === dto.category && round.sex === dto.sex,
      );

    const roundIndex = rounds.length === 0 ? 0 : dto.index ?? rounds.length;

    const round = new BoulderingRound(
      dto.category,
      dto.sex,
      dto.name,
      roundIndex,
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

    // Add registrations if this is the first round
    if (round.index === 0) {
      const registrations = competition.registrations.getItems();
      const climbersRegistered = registrations.map((r) => r.climber);
      await this.addClimbers(round, ...climbersRegistered);
    }

    if (rounds.length > 0) {
      // Verify that the round index will be next to another index
      const minDistance = rounds.reduce((minDistance, round) => {
        const distance = Math.abs(round.index - roundIndex);
        return distance < minDistance ? distance : minDistance;
      }, Number.MAX_SAFE_INTEGER);

      if (minDistance > 1) {
        throw new UnprocessableEntityException('Invalid round index');
      }

      // Shift other rounds indexes if necessary
      for (const r of rounds) {
        if (r.index >= roundIndex) {
          r.index++;
          // Remove climbers in this round because when we add a round before it
          // then it has no sense to already have climbers in this round
          r.groups.removeAll();
          this.boulderingRoundRepository.persistLater(r);
        }
      }
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
    boulderId: typeof Boulder.prototype.id,
    climber: User,
    dto: CreateBoulderingResultDto,
  ): Promise<BoulderingResult> {
    const [round, boulder] = await Promise.all([
      this.getOrFail(roundId, [
        'groups',
        'groups.climbers',
        'groups.boulders',
        'groups.results',
      ]),
      this.boulderService.getOrFail(boulderId),
    ]);

    const groups = round.groups.getItems();
    const group = groups.find((g) => g.climbers.contains(climber));

    if (!group) {
      throw new BadRequestException('Climber not in round');
    }

    if (!group.boulders.contains(boulder)) {
      throw new BadRequestException('Boulder not in round');
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
    if (round.takesNewClimbers()) {
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
          throw new UnprocessableEntityException(
            'This round is not handling this category',
          );
        }
      }

      await this.boulderingRoundRepository.persistAndFlush(round);
    } else {
      throw new BadRequestException('This round cannot take new climbers');
    }
  }
}
