import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from 'nestjs-mikro-orm';
import { EntityRepository } from 'mikro-orm';
import {
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

    return this.boulderingResultService.addResult(round, boulder, climber, dto);
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
