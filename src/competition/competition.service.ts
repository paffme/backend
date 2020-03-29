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
import { CompetitionDto } from './dto/out/competition.dto';
import { validate } from 'class-validator';
import { CreateCompetitionDTO } from './dto/in/body/create-competition.dto';
import { CreateCompetitionRegistrationDto } from './dto/in/body/create-competition-registration.dto';
import { UserService } from '../user/user.service';
import { CompetitionRegistration } from '../shared/entity/competition-registration.entity';
import { User } from '../user/user.entity';
import { AddJuryPresidentDto } from './dto/in/body/add-jury-president.dto';
import { AddJudgeDto } from './dto/in/body/add-judge.dto';
import { AddRouteSetterDto } from './dto/in/body/add-route-setter.dto';
import { AddTechnicalDelegateDto } from './dto/in/body/add-technical-delegate.dto';
import { AddChiefRouteSetterDto } from './dto/in/body/add-chief-route-setter.dto';

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

  async getOrFail(
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

  getAll(): Promise<Competition[]> {
    return this.competitionRepository.findAll();
  }

  async create(dto: CreateCompetitionDTO): Promise<Competition> {
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
    const competition = await this.getOrFail(competitionId);
    const user = await this.userService.getOrFail(dto.userId);

    await this.competitionRegistrationRepository.persistAndFlush(
      new CompetitionRegistration(competition, user),
    );
  }

  async getRegistrations(
    competitionId: typeof Competition.prototype.id,
  ): Promise<CompetitionRegistration[]> {
    const competition = await this.getOrFail(competitionId, ['registrations']);
    return competition.registrations.getItems();
  }

  async removeRegistration(
    competitionId: typeof Competition.prototype.id,
    userId: typeof User.prototype.id,
  ): Promise<void> {
    const [competition, climber] = await Promise.all([
      this.getOrFail(competitionId),
      this.userService.getOrFail(userId),
    ]);

    const registration = await this.competitionRegistrationRepository.findOne({
      competition,
      climber,
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    await this.competitionRegistrationRepository.removeAndFlush(registration);
  }

  async addJuryPresident(
    competitionId: typeof Competition.prototype.id,
    dto: AddJuryPresidentDto,
  ): Promise<void> {
    const competition = await this.getOrFail(competitionId, ['juryPresidents']);
    const user = await this.userService.getOrFail(dto.userId);
    competition.juryPresidents.add(user);
    await this.competitionRepository.persistAndFlush(competition);
  }

  async getJuryPresidents(
    competitionId: typeof Competition.prototype.id,
  ): Promise<User[]> {
    const competition = await this.getOrFail(competitionId, ['juryPresidents']);
    return competition.juryPresidents.getItems();
  }

  async removeJuryPresident(
    competitionId: typeof Competition.prototype.id,
    userId: typeof User.prototype.id,
  ): Promise<void> {
    const [competition, user] = await Promise.all([
      this.getOrFail(competitionId, ['juryPresidents']),
      this.userService.getOrFail(userId),
    ]);

    if (competition.juryPresidents.contains(user)) {
      competition.juryPresidents.remove(user);
    } else {
      throw new NotFoundException('Jury president not found');
    }

    await this.competitionRepository.persistAndFlush(competition);
  }

  async addJudge(
    competitionId: typeof Competition.prototype.id,
    dto: AddJudgeDto,
  ): Promise<void> {
    const competition = await this.getOrFail(competitionId, ['judges']);
    const user = await this.userService.getOrFail(dto.userId);
    competition.judges.add(user);
    await this.competitionRepository.persistAndFlush(competition);
  }

  async getJudges(
    competitionId: typeof Competition.prototype.id,
  ): Promise<User[]> {
    const competition = await this.getOrFail(competitionId, ['judges']);
    return competition.judges.getItems();
  }

  async removeJudge(
    competitionId: typeof Competition.prototype.id,
    userId: typeof User.prototype.id,
  ): Promise<void> {
    const [competition, user] = await Promise.all([
      this.getOrFail(competitionId, ['judges']),
      this.userService.getOrFail(userId),
    ]);

    if (competition.judges.contains(user)) {
      competition.judges.remove(user);
    } else {
      throw new NotFoundException('Judge not found');
    }

    await this.competitionRepository.persistAndFlush(competition);
  }

  async addChiefRouteSetter(
    competitionId: typeof Competition.prototype.id,
    dto: AddChiefRouteSetterDto,
  ): Promise<void> {
    const competition = await this.getOrFail(competitionId, [
      'chiefRouteSetters',
    ]);

    const user = await this.userService.getOrFail(dto.userId);
    competition.chiefRouteSetters.add(user);
    await this.competitionRepository.persistAndFlush(competition);
  }

  async getChiefRouteSetters(
    competitionId: typeof Competition.prototype.id,
  ): Promise<User[]> {
    const competition = await this.getOrFail(competitionId, [
      'chiefRouteSetters',
    ]);

    return competition.chiefRouteSetters.getItems();
  }

  async removeChiefRouteSetter(
    competitionId: typeof Competition.prototype.id,
    userId: typeof User.prototype.id,
  ): Promise<void> {
    const [competition, user] = await Promise.all([
      this.getOrFail(competitionId, ['chiefRouteSetters']),
      this.userService.getOrFail(userId),
    ]);

    if (competition.chiefRouteSetters.contains(user)) {
      competition.chiefRouteSetters.remove(user);
    } else {
      throw new NotFoundException('Judge not found');
    }

    await this.competitionRepository.persistAndFlush(competition);
  }

  async addRouteSetter(
    competitionId: typeof Competition.prototype.id,
    dto: AddRouteSetterDto,
  ): Promise<void> {
    const competition = await this.getOrFail(competitionId, ['routeSetters']);
    const user = await this.userService.getOrFail(dto.userId);
    competition.routeSetters.add(user);
    await this.competitionRepository.persistAndFlush(competition);
  }

  async getRouteSetters(
    competitionId: typeof Competition.prototype.id,
  ): Promise<User[]> {
    const competition = await this.getOrFail(competitionId, ['routeSetters']);
    return competition.routeSetters.getItems();
  }

  async removeRouteSetter(
    competitionId: typeof Competition.prototype.id,
    userId: typeof User.prototype.id,
  ): Promise<void> {
    const [competition, user] = await Promise.all([
      this.getOrFail(competitionId, ['routeSetters']),
      this.userService.getOrFail(userId),
    ]);

    if (competition.routeSetters.contains(user)) {
      competition.routeSetters.remove(user);
    } else {
      throw new NotFoundException('Judge not found');
    }

    await this.competitionRepository.persistAndFlush(competition);
  }

  async addTechnicalDelegate(
    competitionId: typeof Competition.prototype.id,
    dto: AddTechnicalDelegateDto,
  ): Promise<void> {
    const competition = await this.getOrFail(competitionId, [
      'technicalDelegates',
    ]);

    const user = await this.userService.getOrFail(dto.userId);
    competition.technicalDelegates.add(user);
    await this.competitionRepository.persistAndFlush(competition);
  }

  async getTechnicalDelegates(
    competitionId: typeof Competition.prototype.id,
  ): Promise<User[]> {
    const competition = await this.getOrFail(competitionId, [
      'technicalDelegates',
    ]);

    return competition.technicalDelegates.getItems();
  }

  async removeTechnicalDelegate(
    competitionId: typeof Competition.prototype.id,
    userId: typeof User.prototype.id,
  ): Promise<void> {
    const [competition, user] = await Promise.all([
      this.getOrFail(competitionId, ['technicalDelegates']),
      this.userService.getOrFail(userId),
    ]);

    if (competition.technicalDelegates.contains(user)) {
      competition.technicalDelegates.remove(user);
    } else {
      throw new NotFoundException('Judge not found');
    }

    await this.competitionRepository.persistAndFlush(competition);
  }
}
