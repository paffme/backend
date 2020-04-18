import {
  Injectable,
  NotFoundException,
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
import { BoulderingUnlimitedContestRankingService } from './bouldering-unlimited-contest-ranking.service';

@Injectable()
export class BoulderingRoundService {
  private readonly getRankingsFunctions: {
    [key in BoulderingRoundRankingType]: (
      round: BoulderingRound,
    ) => BoulderingRanking[];
  } = {
    [BoulderingRoundRankingType.UNLIMITED_CONTEST]: this.boulderingUnlimitedContestRankingService.getRankings.bind(
      this.boulderingUnlimitedContestRankingService,
    ),
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    [BoulderingRoundRankingType.LIMITED_CONTEST]: undefined,
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    [BoulderingRoundRankingType.CIRCUIT]: undefined,
  };

  constructor(
    @InjectRepository(BoulderingRound)
    private readonly boulderingRoundRepository: EntityRepository<
      BoulderingRound
    >,
    private readonly boulderingResultService: BoulderingResultService,
    private readonly boulderService: BoulderService,
    private readonly boulderingUnlimitedContestRankingService: BoulderingUnlimitedContestRankingService,
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

  // private compareByTops(
  //   a: ClimberResultsMapEntry<BoulderingRanking>,
  //   b: ClimberResultsMapEntry<BoulderingRanking>,
  // ): number {
  //   if (a[1].tops > b[1].tops) {
  //     return -1;
  //   }
  //
  //   if (a[1].tops < b[1].tops) {
  //     return 1;
  //   }
  //
  //   return 0;
  // }
  //
  // private compareByTopsInTries(
  //   a: ClimberResultsMapEntry<BoulderingCountedRanking>,
  //   b: ClimberResultsMapEntry<BoulderingCountedRanking>,
  // ): number {
  //   if (a[1].topsInTries > b[1].topsInTries) {
  //     return 1;
  //   }
  //
  //   if (a[1].topsInTries < b[1].topsInTries) {
  //     return -1;
  //   }
  //
  //   return 0;
  // }
  //
  // private compareByZones(
  //   a: ClimberResultsMapEntry<BoulderingCountedRanking>,
  //   b: ClimberResultsMapEntry<BoulderingCountedRanking>,
  // ): number {
  //   if (a[1].zones > b[1].zones) {
  //     return -1;
  //   }
  //
  //   if (a[1].zones < b[1].zones) {
  //     return 1;
  //   }
  //
  //   return 0;
  // }
  //
  // private compareByZonesInTries(
  //   a: ClimberResultsMapEntry<BoulderingCountedRanking>,
  //   b: ClimberResultsMapEntry<BoulderingCountedRanking>,
  // ): number {
  //   if (a[1].zonesInTries > b[1].zonesInTries) {
  //     return 1;
  //   }
  //
  //   if (a[1].zonesInTries < b[1].zonesInTries) {
  //     return -1;
  //   }
  //
  //   return 0;
  // }
  //
  // private areExAequo(
  //   round: BoulderingRound,
  //   a: ClimberResultsMapEntry<BoulderingRanking>,
  //   b: ClimberResultsMapEntry<BoulderingRanking>,
  // ): boolean {
  //   const resultA = a[1];
  //   const resultB = b[1];
  //
  //   if (resultA.tops !== resultB.tops) {
  //     return false;
  //   }
  //
  //   if (resultA.type === BoulderingRoundRankingType.LIMITED_CONTEST) {
  //     if (
  //       result.zones !== b[1].zones ||
  //       result.zonesInTries !== b[1].zonesInTries
  //     ) {
  //       return false;
  //     }
  //   }
  //
  //   if (
  //     BoulderingRoundService.isRankingWithCountedTries(round) &&
  //     a[1].topsInTries !== b[1].topsInTries
  //   ) {
  //     return false;
  //   }
  //
  //   return true;
  // }

  async updateRankings(round: BoulderingRound): Promise<void> {
    round.rankings = this.getRankingsFunctions[round.rankingType](round);
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

  static isRankingWithCountedTries(
    rankingType: BoulderingRoundRankingType,
  ): rankingType is
    | BoulderingRoundRankingType.LIMITED_CONTEST
    | BoulderingRoundRankingType.CIRCUIT {
    return (
      rankingType === BoulderingRoundRankingType.LIMITED_CONTEST ||
      rankingType === BoulderingRoundRankingType.CIRCUIT
    );
  }

  static isRankingWithCountedZones(
    rankingType: BoulderingRoundRankingType,
  ): rankingType is
    | BoulderingRoundRankingType.LIMITED_CONTEST
    | BoulderingRoundRankingType.CIRCUIT {
    return (
      rankingType === BoulderingRoundRankingType.LIMITED_CONTEST ||
      rankingType === BoulderingRoundRankingType.CIRCUIT
    );
  }
}
