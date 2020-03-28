import { Injectable } from '@nestjs/common';
import { BaseMapper } from './base.mapper';
import { morphism } from 'morphism';
import { CompetitionRegistrationDto } from '../../competition/dto/out/competition-registration.dto';
import { CompetitionRegistration } from '../entity/competition-registration.entity';

@Injectable()
export class CompetitionRegistrationMapper extends BaseMapper<
  CompetitionRegistrationDto,
  CompetitionRegistration
> {
  constructor() {
    super({
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      userId: 'climber.id',
      competitionId: 'competition.id',
    });
  }

  public map(
    competitionRegistration: CompetitionRegistration,
  ): CompetitionRegistrationDto {
    return morphism(this.schema, competitionRegistration);
  }

  public mapArray(
    competitionRegistrations: CompetitionRegistration[],
  ): CompetitionRegistrationDto[] {
    return competitionRegistrations.map((c) => this.map(c));
  }
}
