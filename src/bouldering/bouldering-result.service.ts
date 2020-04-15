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
import { BoulderingRoundService } from './bouldering-round.service';

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
      if (!BoulderingRoundService.isRoundWithCountedTries(round)) {
        throw new UnprocessableEntityException(
          "Can't add a try for this kind of round",
        );
      }

      result.tries++;
    }

    if (typeof dto.top === 'boolean') {
      result.top = dto.top;

      if (BoulderingRoundService.isRoundWithCountedTries(round)) {
        result.topInTries = result.top ? result.tries : 0;
      }
    }

    if (typeof dto.zone === 'boolean') {
      if (!BoulderingRoundService.isRoundWithCountedZones(round)) {
        throw new UnprocessableEntityException(
          "Can't add a zone for this kind of round",
        );
      }

      result.zone = dto.zone;
      result.zoneInTries = result.zone ? result.tries : 0;
    }

    await this.boulderingResultRepository.persistAndFlush(result);
    return result;
  }
}