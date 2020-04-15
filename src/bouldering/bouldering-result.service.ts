import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from 'nestjs-mikro-orm';
import { EntityRepository } from 'mikro-orm';
import {
  BoulderingRound,
  BoulderingRoundRankingType,
} from './bouldering-round.entity';
import { BoulderingResult } from './bouldering-result.entity';
import { CreateBoulderingResultDto } from '../competition/dto/in/body/create-bouldering-result.dto';
import { User } from '../user/user.entity';
import { Boulder } from './boulder.entity';

@Injectable()
export class BoulderingResultService {
  constructor(
    @InjectRepository(BoulderingResult)
    private readonly boulderingResultRepository: EntityRepository<
      BoulderingResult
    >,
  ) {}

  createNewInstance(
    round: BoulderingRound,
    boulder: Boulder,
    climber: User,
  ): BoulderingResult {
    const result = new BoulderingResult(climber, round, boulder);
    this.boulderingResultRepository.persistLater(result);
    return result;
  }

  async getOrCreateNewInstance(
    round: BoulderingRound,
    boulder: Boulder,
    climber: User,
  ): Promise<BoulderingResult> {
    const result = await this.boulderingResultRepository.findOne({
      climber,
      round,
    });

    if (!result) {
      return this.createNewInstance(round, boulder, climber);
    }

    return result;
  }

  async addResult(
    round: BoulderingRound,
    boulder: Boulder,
    climber: User,
    dto: CreateBoulderingResultDto,
  ): Promise<BoulderingResult> {
    const result = await this.getOrCreateNewInstance(round, boulder, climber);

    if (dto.try) {
      if (round.rankingType === BoulderingRoundRankingType.UNLIMITED_CONTEST) {
        throw new UnprocessableEntityException(
          "Can't add a try when the round is an unlimited contest",
        );
      }

      result.tries++;
    }

    if (typeof dto.top === 'boolean') {
      result.top = dto.top;

      if (
        round.rankingType === BoulderingRoundRankingType.CIRCUIT ||
        round.rankingType === BoulderingRoundRankingType.LIMITED_CONTEST
      ) {
        result.topInTries = result.top ? result.tries : 0;
      }
    }

    if (typeof dto.zone === 'boolean') {
      if (round.rankingType == BoulderingRoundRankingType.UNLIMITED_CONTEST) {
        throw new UnprocessableEntityException(
          "Can't add a zone when the round is an unlimited contest",
        );
      }

      result.zone = dto.zone;
      result.zoneInTries = result.zone ? result.tries : 0;
    }

    await this.boulderingResultRepository.persistAndFlush(result);
    return result;
  }
}
