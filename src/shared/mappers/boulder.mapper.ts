import { Injectable } from '@nestjs/common';
import { BaseMapper } from './base.mapper';
import { morphism } from 'morphism';

import { Boulder } from '../../bouldering/boulder/boulder.entity';
import { BoulderDto } from '../../bouldering/dto/out/boulder.dto';
import { LimitedUserMapper } from './limited-user.mapper';

@Injectable()
export class BoulderMapper extends BaseMapper<BoulderDto, Boulder> {
  constructor(limitedUserMapper: LimitedUserMapper) {
    super({
      id: 'id',
      judges: (boulder) =>
        limitedUserMapper.mapArray(boulder.judges.getItems()),
    });
  }

  public map(boulder: Boulder): BoulderDto {
    return morphism(this.schema, boulder);
  }

  public mapArray(boulders: Boulder[]): BoulderDto[] {
    return boulders.sort((a, b) => a.index - b.index).map((b) => this.map(b));
  }
}
