import { Injectable } from '@nestjs/common';
import { BaseMapper } from './base.mapper';
import { morphism } from 'morphism';
import { BoulderingRound } from '../../bouldering/round/bouldering-round.entity';
import { BoulderingLimitedRoundDto } from '../../bouldering/dto/out/bouldering-limited-round.dto';
import {
  RoundByCategoryByType,
  RoundBySex,
  RoundByType,
} from '../../competition/types/round-by-category-by-type.type';
import { CategoryName } from '../types/category-name.enum';
import { BoulderingLimitedRoundMapper } from './bouldering-limited-round.mapper';
import { Sex } from '../types/sex.enum';
import { CompetitionRoundType } from '../../competition/competition-round-type.enum';
import { isDefined } from '../utils/objects.helper';

@Injectable()
export class RoundByTypeMapper extends BaseMapper<
  RoundByType<BoulderingLimitedRoundDto>,
  RoundByType<BoulderingRound>
> {
  constructor(boulderingMapper: BoulderingLimitedRoundMapper) {
    super({
      [CompetitionRoundType.QUALIFIER]: (roundByType) => {
        const round = roundByType[CompetitionRoundType.QUALIFIER];

        if (isDefined(round)) {
          return boulderingMapper.map(round);
        }
      },
      [CompetitionRoundType.SEMI_FINAL]: (roundByType) => {
        const round = roundByType[CompetitionRoundType.SEMI_FINAL];

        if (isDefined(round)) {
          return boulderingMapper.map(round);
        }
      },
      [CompetitionRoundType.FINAL]: (roundByType) => {
        const round = roundByType[CompetitionRoundType.FINAL];

        if (isDefined(round)) {
          return boulderingMapper.map(round);
        }
      },
    });
  }

  public map(
    round: RoundByType<BoulderingRound>,
  ): RoundByType<BoulderingLimitedRoundDto> {
    return morphism(this.schema, round);
  }

  public mapArray(
    rounds: RoundByType<BoulderingRound>[],
  ): RoundByType<BoulderingLimitedRoundDto>[] {
    return rounds.map((r) => this.map(r));
  }
}

@Injectable()
export class RoundBySexMapper extends BaseMapper<
  RoundBySex<BoulderingLimitedRoundDto>,
  RoundBySex<BoulderingRound>
> {
  constructor(roundByTypeMapper: RoundByTypeMapper) {
    super({
      [Sex.Female]: (roundBySex) => {
        const roundByType = roundBySex[Sex.Female];

        if (isDefined(roundByType)) {
          return roundByTypeMapper.map(roundByType);
        }
      },
      [Sex.Male]: (roundBySex) => {
        const roundByType = roundBySex[Sex.Male];

        if (isDefined(roundByType)) {
          return roundByTypeMapper.map(roundByType);
        }
      },
    });
  }

  public map(
    round: RoundBySex<BoulderingRound>,
  ): RoundBySex<BoulderingLimitedRoundDto> {
    return morphism(this.schema, round);
  }

  public mapArray(
    rounds: RoundBySex<BoulderingRound>[],
  ): RoundBySex<BoulderingLimitedRoundDto>[] {
    return rounds.map((r) => this.map(r));
  }
}

@Injectable()
export class BoulderingRoundsByCategoryByTypeMapper extends BaseMapper<
  RoundByCategoryByType<BoulderingLimitedRoundDto>,
  RoundByCategoryByType<BoulderingRound>
> {
  constructor(roundBySexMapper: RoundBySexMapper) {
    // TODO: I didn't find a better way to do this without loosing type checking
    // TODO: Looping over Object.keys/values/entries will loose the key types
    super({
      [CategoryName.Microbe]: (roundByCategory) => {
        const roundBySex = roundByCategory[CategoryName.Microbe];

        if (isDefined(roundBySex)) {
          return roundBySexMapper.map(roundBySex);
        }
      },
      [CategoryName.Poussin]: (roundByCategory) => {
        const roundBySex = roundByCategory[CategoryName.Poussin];

        if (isDefined(roundBySex)) {
          return roundBySexMapper.map(roundBySex);
        }
      },
      [CategoryName.Benjamin]: (roundByCategory) => {
        const roundBySex = roundByCategory[CategoryName.Benjamin];

        if (isDefined(roundBySex)) {
          return roundBySexMapper.map(roundBySex);
        }
      },
      [CategoryName.Minime]: (roundByCategory) => {
        const roundBySex = roundByCategory[CategoryName.Minime];

        if (isDefined(roundBySex)) {
          return roundBySexMapper.map(roundBySex);
        }
      },
      [CategoryName.Cadet]: (roundByCategory) => {
        const roundBySex = roundByCategory[CategoryName.Cadet];

        if (isDefined(roundBySex)) {
          return roundBySexMapper.map(roundBySex);
        }
      },
      [CategoryName.Junior]: (roundByCategory) => {
        const roundBySex = roundByCategory[CategoryName.Junior];

        if (isDefined(roundBySex)) {
          return roundBySexMapper.map(roundBySex);
        }
      },
      [CategoryName.Senior]: (roundByCategory) => {
        const roundBySex = roundByCategory[CategoryName.Senior];

        if (isDefined(roundBySex)) {
          return roundBySexMapper.map(roundBySex);
        }
      },
      [CategoryName.Veteran]: (roundByCategory) => {
        const roundBySex = roundByCategory[CategoryName.Veteran];

        if (isDefined(roundBySex)) {
          return roundBySexMapper.map(roundBySex);
        }
      },
    });
  }

  public map(
    round: RoundByCategoryByType<BoulderingRound>,
  ): RoundByCategoryByType<BoulderingLimitedRoundDto> {
    return morphism(this.schema, round);
  }

  public mapArray(
    rounds: RoundByCategoryByType<BoulderingRound>[],
  ): RoundByCategoryByType<BoulderingLimitedRoundDto>[] {
    return rounds.map((r) => this.map(r));
  }
}
