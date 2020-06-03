import { Injectable } from '@nestjs/common';
import { InjectRepository } from 'nestjs-mikro-orm';
import { EntityRepository } from 'mikro-orm';
import { BoulderingResult } from './bouldering-result.entity';
import { CreateBoulderingResultDto } from '../../competition/dto/in/body/create-bouldering-result.dto';
import { User } from '../../user/user.entity';
import { Boulder } from '../boulder/boulder.entity';
import {
  BoulderingGroup,
  BoulderingGroupState,
} from '../group/bouldering-group.entity';
import { WrongResultForRoundError } from '../errors/wrong-result-for-round.error';
import { MaxTriesReachedError } from '../errors/max-tries-reached.error';
import { AddResultWithoutOngoingGroupError } from '../../competition/errors/add-result-without-ongoing-group.error';
import { ClimberNotInGroupError } from '../errors/climber-not-in-group.error';
import { BoulderNotInGroupError } from '../errors/boulder-not-in-group.error';

@Injectable()
export class BoulderingResultService {
  constructor(
    @InjectRepository(BoulderingResult)
    private readonly boulderingResultRepository: EntityRepository<
      BoulderingResult
    >,
  ) {}

  createNewInstance(
    group: BoulderingGroup,
    boulder: Boulder,
    climber: User,
  ): BoulderingResult {
    const result = new BoulderingResult(climber, group, boulder);
    this.boulderingResultRepository.persistLater(result);
    return result;
  }

  async getOrCreateNewInstance(
    group: BoulderingGroup,
    boulder: Boulder,
    climber: User,
  ): Promise<BoulderingResult> {
    const result = await this.boulderingResultRepository.findOne({
      climber,
      boulder,
      group,
    });

    if (!result) {
      return this.createNewInstance(group, boulder, climber);
    }

    return result;
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  async addResult(
    group: BoulderingGroup,
    boulder: Boulder,
    climber: User,
    dto: CreateBoulderingResultDto,
  ): Promise<BoulderingResult> {
    if (group.state !== BoulderingGroupState.ONGOING) {
      throw new AddResultWithoutOngoingGroupError();
    }

    await Promise.all([group.climbers.init(), group.boulders.init()]);

    if (!group.climbers.contains(climber)) {
      throw new ClimberNotInGroupError();
    }

    if (!group.boulders.contains(boulder)) {
      throw new BoulderNotInGroupError();
    }

    const result = await this.getOrCreateNewInstance(group, boulder, climber);

    if (dto.try) {
      if (!group.round.isRankingWithCountedTries()) {
        throw new WrongResultForRoundError(
          "Can't add a try for this kind of round",
        );
      }

      if (
        typeof group.round.maxTries === 'number' &&
        result.tries >= group.round.maxTries
      ) {
        throw new MaxTriesReachedError();
      }

      result.tries++;
    }

    if (typeof dto.top === 'boolean') {
      result.top = dto.top;

      if (group.round.isRankingWithCountedTries()) {
        result.topInTries = result.top ? result.tries : 0;
      }

      if (!result.zone && group.round.isRankingWithCountedZones()) {
        // When there is a top there is automatically a zone
        dto.zone = true;
      }
    }

    if (typeof dto.zone === 'boolean') {
      if (!group.round.isRankingWithCountedZones()) {
        throw new WrongResultForRoundError(
          "Can't add a zone for this kind of round",
        );
      }

      result.zone = dto.zone;

      if (result.zone) {
        result.zoneInTries = result.tries;
      } else {
        result.top = false;
        result.topInTries = 0;
        result.zoneInTries = 0;
      }
    }

    await this.boulderingResultRepository.persistAndFlush(result);
    return result;
  }
}
