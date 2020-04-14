import { Injectable } from '@nestjs/common';
import { BaseMapper } from './base.mapper';
import { morphism } from 'morphism';
import { BoulderingResultDto } from '../../bouldering/dto/out/bouldering-result.dto';
import { BoulderingResult } from '../../bouldering/bouldering-result.entity';

@Injectable()
export class BoulderingResultMapper extends BaseMapper<
  BoulderingResultDto,
  BoulderingResult
> {
  constructor() {
    super({});
  }

  public map(result: BoulderingResult): BoulderingResultDto {
    return morphism(this.schema, result);
  }

  public mapArray(results: BoulderingResult[]): BoulderingResultDto[] {
    return results.map((r) => this.map(r));
  }
}
