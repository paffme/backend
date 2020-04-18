import {
  Injectable,
  NotFoundException,
  NotImplementedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from 'nestjs-mikro-orm';
import { EntityRepository } from 'mikro-orm';
import {
  BoulderingRanking,
  BoulderingRound,
  BoulderingRoundRankingType,
  BoulderingRoundType,
} from './bouldering-round.entity';
import { BoulderingResult } from './bouldering-result.entity';
import { Competition } from '../competition/competition.entity';
import { CreateBoulderingResultDto } from '../competition/dto/in/body/create-bouldering-result.dto';
import { BoulderingResultService } from './bouldering-result.service';
import { CreateBoulderingRoundDto } from '../competition/dto/in/body/create-bouldering-round.dto';
import { User } from '../user/user.entity';
import { Boulder } from './boulder.entity';
import { BoulderService } from './boulder.service';

type AggregatedResults = Pick<
  BoulderingRanking,
  'tops' | 'topsInTries' | 'zones' | 'zonesInTries'
>;

type ClimberResultsMap = Map<typeof User.prototype.id, AggregatedResults>;
type ClimberResultsMapEntry = [number, AggregatedResults];

@Injectable()
export class BoulderingRoundService {
  constructor(
    @InjectRepository(BoulderingRound)
    private readonly boulderingRoundRepository: EntityRepository<
      BoulderingRound
    >,
    private readonly boulderingResultService: BoulderingResultService,
    private readonly boulderService: BoulderService,
  ) {}

  async getOrFail(
    roundId: typeof BoulderingRound.prototype.id,
  ): Promise<BoulderingRound> {
    const round = await this.boulderingRoundRepository.findOne(roundId);

    if (!round) {
      throw new NotFoundException('Round not found');
    }

    return round;
  }

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

    const roundIndex = dto.index ?? competition.boulderingRounds.count();

    const round = new BoulderingRound(
      dto.name,
      roundIndex,
      dto.quota,
      dto.rankingType,
      dto.type,
      competition,
    );

    // Handle other rounds indexes
    const rounds = await this.boulderingRoundRepository.find({
      competition,
    });

    for (const r of rounds) {
      if (r.index >= roundIndex) {
        r.index++;
        this.boulderingRoundRepository.persistLater(r);
      }
    }

    // Persist
    await this.boulderingRoundRepository.persistAndFlush(round);

    // Create boulders
    await this.boulderService.createMany(round, dto.boulders);

    return round;
  }

  private compareByTops(
    a: ClimberResultsMapEntry,
    b: ClimberResultsMapEntry,
  ): number {
    if (a[1].tops > b[1].tops) {
      return -1;
    }

    if (a[1].tops < b[1].tops) {
      return 1;
    }

    return 0;
  }

  private compareByTopsInTries(
    a: ClimberResultsMapEntry,
    b: ClimberResultsMapEntry,
  ): number {
    if (a[1].topsInTries > b[1].topsInTries) {
      return 1;
    }

    if (a[1].topsInTries < b[1].topsInTries) {
      return -1;
    }

    return 0;
  }

  private compareByZones(
    a: ClimberResultsMapEntry,
    b: ClimberResultsMapEntry,
  ): number {
    if (a[1].zones > b[1].zones) {
      return -1;
    }

    if (a[1].zones < b[1].zones) {
      return 1;
    }

    return 0;
  }

  private compareByZonesInTries(
    a: ClimberResultsMapEntry,
    b: ClimberResultsMapEntry,
  ): number {
    if (a[1].zonesInTries > b[1].zonesInTries) {
      return 1;
    }

    if (a[1].zonesInTries < b[1].zonesInTries) {
      return -1;
    }

    return 0;
  }

  private areExAequo(
    round: BoulderingRound,
    a: ClimberResultsMapEntry,
    b: ClimberResultsMapEntry,
  ): boolean {
    if (a[1].tops !== b[1].tops) {
      return false;
    }

    if (BoulderingRoundService.isRoundWithCountedZones(round)) {
      if (
        a[1].zones !== b[1].zones ||
        a[1].zonesInTries !== b[1].zonesInTries
      ) {
        return false;
      }
    }

    if (
      BoulderingRoundService.isRoundWithCountedTries(round) &&
      a[1].topsInTries !== b[1].topsInTries
    ) {
      return false;
    }

    return true;
  }

  async updateRankings(round: BoulderingRound): Promise<void> {
    // Group results by climber and aggregate results
    const climberResults = round.results
      .getItems()
      .reduce<ClimberResultsMap>((map, result) => {
        const boulderIndex = result.boulder.index;
        const boulders = result.round.boulders.count();

        const aggregatedResults = map.get(result.climber.id) || {
          tops: new Array(boulders).fill(false),
          topsInTries: new Array(boulders).fill(0),
          zones: new Array(boulders).fill(false),
          zonesInTries: new Array(boulders).fill(0),
        };

        aggregatedResults.tops[boulderIndex] = result.top;
        aggregatedResults.topsInTries[boulderIndex] = result.topInTries;
        aggregatedResults.zones[boulderIndex] = result.zone;
        aggregatedResults.zonesInTries[boulderIndex] = result.zoneInTries;

        map.set(result.climber.id, aggregatedResults);
        return map;
      }, new Map());

    // Do the ranking by sorting results
    let entries = Array.from(climberResults);

    // Sort without handling ex-aequo results
    switch (round.rankingType) {
      case BoulderingRoundRankingType.CIRCUIT:
      case BoulderingRoundRankingType.LIMITED_CONTEST:
        entries = entries
          .sort(this.compareByTops)
          .sort(this.compareByZones)
          .sort(this.compareByTopsInTries)
          .sort(this.compareByZonesInTries);
        break;
      case BoulderingRoundRankingType.UNLIMITED_CONTEST:
        entries = entries.sort(this.compareByTops);
        break;
      default:
        throw new NotImplementedException('Unhandled ranking type');
    }

    // Handle ex-aequo results
    const rankings: Map<typeof User.prototype.id, number> = new Map();
    let previousClimberEntry: ClimberResultsMapEntry | undefined;
    let previousClimberRanking: number | undefined;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const [climberId] = entry;
      let ranking: number;

      if (
        typeof previousClimberRanking === 'number' &&
        previousClimberEntry &&
        this.areExAequo(round, previousClimberEntry, entry)
      ) {
        ranking = previousClimberRanking;
      } else {
        ranking = i + 1;
      }

      rankings.set(climberId, ranking);
      previousClimberEntry = entry;
      previousClimberRanking = ranking;
    }

    // Gather all information
    round.rankings = entries.map(
      ([climberId, aggregatedResults]): BoulderingRanking => {
        return {
          climberId,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          ranking: rankings.get(climberId)!,
          ...aggregatedResults,
        };
      },
    );

    await this.boulderingRoundRepository.persistAndFlush(round);
  }

  async addResult(
    roundId: typeof BoulderingRound.prototype.id,
    boulderId: typeof Boulder.prototype.id,
    climber: User,
    dto: CreateBoulderingResultDto,
  ): Promise<BoulderingResult> {
    const [round, boulder] = await Promise.all([
      this.getOrFail(roundId),
      this.boulderService.getOrFail(boulderId),
    ]);

    const result = this.boulderingResultService.addResult(
      round,
      boulder,
      climber,
      dto,
    );

    await this.updateRankings(round);

    return result;
  }

  static isRoundWithCountedTries(round: BoulderingRound): boolean {
    return (
      round.rankingType === BoulderingRoundRankingType.LIMITED_CONTEST ||
      round.rankingType === BoulderingRoundRankingType.CIRCUIT
    );
  }

  static isRoundWithCountedZones(round: BoulderingRound): boolean {
    return (
      round.rankingType === BoulderingRoundRankingType.LIMITED_CONTEST ||
      round.rankingType === BoulderingRoundRankingType.CIRCUIT
    );
  }
}
