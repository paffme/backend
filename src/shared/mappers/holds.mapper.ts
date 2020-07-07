import { Injectable } from '@nestjs/common';
import { BaseMapper } from './base.mapper';
import { morphism } from 'morphism';
import { Boulder } from '../../bouldering/boulder/boulder.entity';
import { HoldsDto } from '../../competition/dto/out/holds.dto';

@Injectable()
export class HoldsMapper extends BaseMapper<HoldsDto, Boulder> {
  constructor() {
    super({
      boundingBoxes: 'boundingBoxes',
    });
  }

  public map(boulder: Boulder): HoldsDto {
    return morphism(this.schema, boulder);
  }

  public mapArray(boulders: Boulder[]): HoldsDto[] {
    return boulders.sort((a, b) => a.index - b.index).map((b) => this.map(b));
  }
}
