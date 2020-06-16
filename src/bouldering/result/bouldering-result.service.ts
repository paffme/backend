import { Injectable, NotImplementedException } from '@nestjs/common';
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
import {
  BulkBoulderingResultsDto,
  BulkResult,
  CircuitResult,
  UnlimitedContestResult,
} from '../../competition/dto/in/body/bulk-bouldering-results.dto';
import { BoulderingRoundRankingType } from '../round/bouldering-round.entity';
import { IncoherentZoneInTriesError } from '../errors/incoherent-zone-in-tries.error';
import { IncoherentTopInTriesError } from '../errors/incoherent-top-in-tries.error';

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

    if (typeof dto.try === 'number') {
      if (!group.round.isRankingWithCountedTries()) {
        throw new WrongResultForRoundError(
          "Can't modify tries for this kind of round",
        );
      }

      if (
        typeof group.round.maxTries === 'number' &&
        result.tries + dto.try >= group.round.maxTries
      ) {
        throw new MaxTriesReachedError();
      }

      result.tries = Math.max(0, result.tries + dto.try);
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

  // eslint-disable-next-line sonarjs/cognitive-complexity
  private async processBulkResult(
    group: BoulderingGroup,
    climber: User,
    boulder: Boulder,
    result: BulkResult,
  ): Promise<void> {
    const instance = await this.getOrCreateNewInstance(group, boulder, climber);

    if (
      group.round.rankingType === BoulderingRoundRankingType.CIRCUIT ||
      group.round.rankingType === BoulderingRoundRankingType.LIMITED_CONTEST
    ) {
      const countedTriesResult = result as CircuitResult;
      const top = countedTriesResult.top ?? instance.top;
      const topInTries = countedTriesResult.topInTries ?? instance.topInTries;

      if (top && topInTries === 0) {
        throw new IncoherentTopInTriesError(
          'topInTries cannot be 0 if there is a top',
        );
      }

      const zone = countedTriesResult.zone ?? instance.zone;
      const zoneInTries =
        countedTriesResult.zoneInTries ?? instance.zoneInTries;

      if (zone && zoneInTries === 0) {
        throw new IncoherentZoneInTriesError(
          'zoneInTries cannot be 0 if there is a zone',
        );
      }

      const tries = instance.tries > zoneInTries ? instance.tries : zoneInTries;

      instance.top = top;
      instance.topInTries = topInTries;
      instance.zone = zone;
      instance.zoneInTries = zoneInTries;
      instance.tries = tries;
    } else if (
      group.round.rankingType === BoulderingRoundRankingType.UNLIMITED_CONTEST
    ) {
      const unlimitedResult = result as UnlimitedContestResult;
      instance.top = unlimitedResult.top;
    } else {
      throw new NotImplementedException('Unhandled ranking type');
    }

    this.boulderingResultRepository.persistLater(instance);
  }

  async bulkResults(
    group: BoulderingGroup,
    dto: BulkBoulderingResultsDto,
  ): Promise<void> {
    const [climbers, boulders] = await Promise.all([
      group.climbers.loadItems(),
      group.boulders.loadItems(),
    ]);

    await Promise.all(
      dto.results.map((result) => {
        const boulder = boulders.find((b) => b.id === result.boulderId);

        if (!boulder) {
          throw new BoulderNotInGroupError();
        }

        const climber = climbers.find((c) => c.id === result.climberId);

        if (!climber) {
          throw new ClimberNotInGroupError();
        }

        return this.processBulkResult(group, climber, boulder, result);
      }),
    );

    await this.boulderingResultRepository.flush();
  }
}
