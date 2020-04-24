import { Injectable } from '@nestjs/common';
import { BaseMapper } from './base.mapper';
import { morphism } from 'morphism';
import { RankingsDto } from '../../competition/dto/out/rankings.dto';
import { Rankings } from '../../competition/competition.entity';

@Injectable()
export class RankingsMapper extends BaseMapper<RankingsDto, Rankings> {
  constructor() {
    super({
      microbe: 'microbe',
      poussin: 'benjamin',
      benjamin: 'benjamin',
      minime: 'minime',
      cadet: 'cadet',
      junior: 'junior',
      senior: 'senior',
      veteran: 'veteran',
    });
  }

  public map(rankings: Rankings): RankingsDto {
    return morphism(this.schema, rankings);
  }

  public mapArray(rankings: Rankings[]): RankingsDto[] {
    return rankings.map((r) => this.map(r));
  }
}
