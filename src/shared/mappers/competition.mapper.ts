import { Injectable } from '@nestjs/common';
import { BaseMapper } from './base.mapper';
import { morphism } from 'morphism';
import { Competition } from '../../competition/competition.entity';
import { CompetitionDto } from '../../competition/dto/competition.dto';

@Injectable()
export class CompetitionMapper extends BaseMapper<CompetitionDto, Competition> {
  constructor() {
    super({
      id: 'id',
      name: 'name',
      categories: 'categories',
      startDate: 'startDate',
      endDate: 'endDate',
      city: 'city',
      address: 'address',
      postalCode: 'postalCode',
      type: 'type',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    });
  }

  public map(competition: Competition): CompetitionDto {
    return morphism(this.schema, competition);
  }

  public mapArray(competitions: Competition[]): CompetitionDto[] {
    return competitions.map((c) => this.map(c));
  }
}
