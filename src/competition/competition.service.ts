import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BaseService } from '../shared/base.service';
import { InjectRepository } from 'nestjs-mikro-orm';
import { EntityRepository } from 'mikro-orm';
import { Competition } from './competition.entity';
import { CompetitionMapper } from '../shared/mappers/competition.mapper';
import { CompetitionDto } from './dto/competition.dto';
import { validate } from 'class-validator';
import { CreateCompetitionDTO } from './dto/create-competition.dto';
import { CreateCompetitionRegistrationDto } from './dto/create-competition-registration.dto';
import { UserService } from '../user/user.service';
import { CompetitionRegistration } from '../shared/entity/competition-registration.entity';

@Injectable()
export class CompetitionService extends BaseService<
  Competition,
  CompetitionDto
> {
  private readonly logger = new Logger(CompetitionService.name);

  constructor(
    @InjectRepository(Competition)
    private readonly competitionRepository: EntityRepository<Competition>,
    @InjectRepository(CompetitionRegistration)
    private readonly competitionRegistrationRepository: EntityRepository<
      CompetitionRegistration
    >,
    mapper: CompetitionMapper,
    private readonly userService: UserService,
  ) {
    super(Competition.prototype, mapper);
  }

  async getCompetitionOrFail(
    competitionId: typeof Competition.prototype.id,
    populate?: string[],
  ): Promise<Competition> {
    const competition = await this.competitionRepository.findOne(
      competitionId,
      populate,
    );

    if (!competition) {
      throw new NotFoundException('Competition not found');
    }

    return competition;
  }

  getCompetitions(): Promise<Competition[]> {
    return this.competitionRepository.findAll();
  }

  async createCompetition(dto: CreateCompetitionDTO): Promise<Competition> {
    const newCompetition = new Competition();
    Object.assign(newCompetition, dto);

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

  async register(
    competitionId: typeof Competition.prototype.id,
    dto: CreateCompetitionRegistrationDto,
  ): Promise<void> {
    const competition = await this.getCompetitionOrFail(competitionId);
    const user = await this.userService.getUserOrFail(dto.userId);

    await this.competitionRegistrationRepository.persistAndFlush(
      new CompetitionRegistration(competition, user),
    );
  }

  async getCompetitionRegistrations(
    competitionId: typeof Competition.prototype.id,
  ): Promise<CompetitionRegistration[]> {
    const competition = await this.getCompetitionOrFail(competitionId, [
      'registrations',
    ]);

    return competition.registrations.getItems();
  }
}
