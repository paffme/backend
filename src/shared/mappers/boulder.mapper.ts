import { Injectable } from '@nestjs/common';
import { BaseMapper } from './base.mapper';
import { morphism } from 'morphism';

import { Boulder } from '../../bouldering/boulder.entity';
import { BoulderDto } from '../../bouldering/dto/out/boulder.dto';

@Injectable()
export class BoulderMapper extends BaseMapper<BoulderDto, Boulder> {
  constructor() {
    super({
      id: 'id',
      index: 'index',
    });
  }

  public map(boulder: Boulder): BoulderDto {
    return morphism(this.schema, boulder);
  }

  public mapArray(boulders: Boulder[]): BoulderDto[] {
    return boulders.map((b) => this.map(b));
  }
}
