import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { BaseService } from '../shared/base.service';
import { InjectRepository } from 'nestjs-mikro-orm';
import { EntityRepository } from 'mikro-orm';
import { Competition } from './competition.entity';
import { CompetitionMapper } from '../shared/mappers/competition.mapper';
import { CompetitionDto } from './dto/competition.dto';
import { validate } from 'class-validator';
import { CreateCompetitionDTO } from './dto/create-competition.dto';

@Injectable()
export class CompetitionService extends BaseService<
  Competition,
  CompetitionDto
> {
  private readonly logger = new Logger(CompetitionService.name);

  constructor(
    @InjectRepository(Competition)
    private readonly competitionRepository: EntityRepository<Competition>,
    mapper: CompetitionMapper,
  ) {
    super(Competition.prototype, mapper);
  }

  getCompetitions(): Promise<Competition[]> {
    return this.competitionRepository.findAll();
  }

  async createCompetition(dto: CreateCompetitionDTO): Promise<Competition> {
    const newCompetition = new Competition();
    Object.apply(newCompetition, dto);

    const errors = await validate(newCompetition);

    if (errors.length > 0) {
      throw new HttpException(
        {
          message: 'Input data validation failed',
          errors,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.competitionRepository.persistAndFlush(newCompetition);
    return newCompetition;
  }
}
