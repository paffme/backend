import { Injectable } from '@nestjs/common';
import { BaseMapper } from './base.mapper';
import { morphism } from 'morphism';
import { ClimberRankingInfosDto } from '../../competition/dto/out/climber-ranking-infos.dto';
import { ClimberRankingInfos } from '../../competition/types/climber-ranking-infos.interface';

@Injectable()
export class ClimberRankingInfosMapper extends BaseMapper<
  ClimberRankingInfosDto,
  ClimberRankingInfos
> {
  constructor() {
    super({
      id: 'id',
      club: 'club',
      firstName: 'firstName',
      lastName: 'lastName',
    });
  }

  public map(climber: ClimberRankingInfos): ClimberRankingInfosDto {
    return morphism(this.schema, climber);
  }

  public mapArray(climbers: ClimberRankingInfos[]): ClimberRankingInfosDto[] {
    return climbers.map((c) => this.map(c));
  }
}
