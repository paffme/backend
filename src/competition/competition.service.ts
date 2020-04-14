import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from 'nestjs-mikro-orm';
import { EntityRepository } from 'mikro-orm';
import {
  Competition,
  CompetitionRelation,
  UserCompetitionRelation,
} from './competition.entity';
import { CompetitionMapper } from '../shared/mappers/competition.mapper';
import { CreateCompetitionDTO } from './dto/in/body/create-competition.dto';
import { UserService } from '../user/user.service';
import { CompetitionRegistration } from '../shared/entity/competition-registration.entity';
import { User } from '../user/user.entity';
import { BoulderingRoundDto } from '../bouldering/dto/out/bouldering-round.dto';
import { BoulderingRoundService } from '../bouldering/bouldering-round.service';
import { BoulderingRound } from '../bouldering/bouldering-round.entity';
import { CreateBoulderingResultDto } from './dto/in/body/create-bouldering-result.dto';
import { BoulderingResult } from '../bouldering/bouldering-result.entity';
import { CreateBoulderingRoundDto } from './dto/in/body/create-bouldering-round.dto';
import { Boulder } from '../bouldering/boulder.entity';

@Injectable()
export class CompetitionService {
  constructor(
    @InjectRepository(Competition)
    private readonly competitionRepository: EntityRepository<Competition>,
    @InjectRepository(CompetitionRegistration)
    private readonly competitionRegistrationRepository: EntityRepository<
      CompetitionRegistration
    >,
    mapper: CompetitionMapper,
    private readonly userService: UserService,
    private readonly boulderingService: BoulderingRoundService,
  ) {}

  async getOrFail(
    competitionId: typeof Competition.prototype.id,
    populate?: CompetitionRelation[],
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

  async create(dto: CreateCompetitionDTO, owner: User): Promise<Competition> {
    const newCompetition = new Competition(
      dto.name,
      dto.type,
      dto.startDate,
      dto.endDate,
      dto.address,
      dto.city,
      dto.postalCode,
      dto.categories,
    );

    newCompetition.organizers.add(owner);

    await this.competitionRepository.persistAndFlush(newCompetition);
    return newCompetition;
  }

  async register(
    competitionId: typeof Competition.prototype.id,
    userId: typeof User.prototype.id,
  ): Promise<void> {
    const competition = await this.getOrFail(competitionId);
    const user = await this.userService.getOrFail(userId);

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

  private async addUserRelation(
    competitionId: typeof Competition.prototype.id,
    userId: typeof User.prototype.id,
    relation: UserCompetitionRelation,
  ): Promise<void> {
    const competition = await this.getOrFail(competitionId, [relation]);
    const user = await this.userService.getOrFail(userId);

    if (competition[relation].contains(user)) {
      throw new ConflictException('User is already in this relation');
    }

    competition[relation].add(user);
    await this.competitionRepository.persistAndFlush(competition);
  }

  private async getUserRelation(
    competitionId: typeof Competition.prototype.id,
    relation: UserCompetitionRelation,
  ): Promise<User[]> {
    const competition = await this.getOrFail(competitionId, [relation]);
    return competition[relation].getItems();
  }

  private async removeUserInRelation(
    competitionId: typeof Competition.prototype.id,
    userId: typeof User.prototype.id,
    relation: UserCompetitionRelation,
  ): Promise<void> {
    const [competition, user] = await Promise.all([
      this.getOrFail(competitionId, [relation]),
      this.userService.getOrFail(userId),
    ]);

    if (competition[relation].contains(user)) {
      competition[relation].remove(user);
      await this.competitionRepository.persistAndFlush(competition);
    } else {
      throw new NotFoundException('User not found in relation');
    }
  }

  async addJuryPresident(
    competitionId: typeof Competition.prototype.id,
    userId: typeof User.prototype.id,
  ): Promise<void> {
    await this.addUserRelation(competitionId, userId, 'juryPresidents');
  }

  getJuryPresidents(
    competitionId: typeof Competition.prototype.id,
  ): Promise<User[]> {
    return this.getUserRelation(competitionId, 'juryPresidents');
  }

  async removeJuryPresident(
    competitionId: typeof Competition.prototype.id,
    userId: typeof User.prototype.id,
  ): Promise<void> {
    await this.removeUserInRelation(competitionId, userId, 'juryPresidents');
  }

  async addJudge(
    competitionId: typeof Competition.prototype.id,
    userId: typeof User.prototype.id,
  ): Promise<void> {
    await this.addUserRelation(competitionId, userId, 'judges');
  }

  getJudges(competitionId: typeof Competition.prototype.id): Promise<User[]> {
    return this.getUserRelation(competitionId, 'judges');
  }

  async removeJudge(
    competitionId: typeof Competition.prototype.id,
    userId: typeof User.prototype.id,
  ): Promise<void> {
    await this.removeUserInRelation(competitionId, userId, 'judges');
  }

  async addChiefRouteSetter(
    competitionId: typeof Competition.prototype.id,
    userId: typeof User.prototype.id,
  ): Promise<void> {
    await this.addUserRelation(competitionId, userId, 'chiefRouteSetters');
  }

  getChiefRouteSetters(
    competitionId: typeof Competition.prototype.id,
  ): Promise<User[]> {
    return this.getUserRelation(competitionId, 'chiefRouteSetters');
  }

  async removeChiefRouteSetter(
    competitionId: typeof Competition.prototype.id,
    userId: typeof User.prototype.id,
  ): Promise<void> {
    await this.removeUserInRelation(competitionId, userId, 'chiefRouteSetters');
  }

  async addRouteSetter(
    competitionId: typeof Competition.prototype.id,
    userId: typeof User.prototype.id,
  ): Promise<void> {
    await this.addUserRelation(competitionId, userId, 'routeSetters');
  }

  getRouteSetters(
    competitionId: typeof Competition.prototype.id,
  ): Promise<User[]> {
    return this.getUserRelation(competitionId, 'routeSetters');
  }

  async removeRouteSetter(
    competitionId: typeof Competition.prototype.id,
    userId: typeof User.prototype.id,
  ): Promise<void> {
    await this.removeUserInRelation(competitionId, userId, 'routeSetters');
  }

  async addTechnicalDelegate(
    competitionId: typeof Competition.prototype.id,
    userId: typeof User.prototype.id,
  ): Promise<void> {
    await this.addUserRelation(competitionId, userId, 'technicalDelegates');
  }

  getTechnicalDelegates(
    competitionId: typeof Competition.prototype.id,
  ): Promise<User[]> {
    return this.getUserRelation(competitionId, 'technicalDelegates');
  }

  async removeTechnicalDelegate(
    competitionId: typeof Competition.prototype.id,
    userId: typeof User.prototype.id,
  ): Promise<void> {
    await this.removeUserInRelation(
      competitionId,
      userId,
      'technicalDelegates',
    );
  }

  async addOrganizer(
    competitionId: typeof Competition.prototype.id,
    userId: typeof User.prototype.id,
  ): Promise<void> {
    await this.addUserRelation(competitionId, userId, 'organizers');
  }

  async getOrganizers(
    competitionId: typeof Competition.prototype.id,
  ): Promise<User[]> {
    return this.getUserRelation(competitionId, 'organizers');
  }

  async removeOrganizer(
    competitionId: typeof Competition.prototype.id,
    userId: typeof User.prototype.id,
  ): Promise<void> {
    const [competition, user] = await Promise.all([
      this.getOrFail(competitionId, ['organizers']),
      this.userService.getOrFail(userId),
    ]);

    if (competition.organizers.contains(user)) {
      if (competition.organizers.length === 1) {
        throw new BadRequestException('The last organizer cannot be removed');
      } else {
        competition.organizers.remove(user);
      }
    } else {
      throw new NotFoundException('Organizer not found');
    }

    await this.competitionRepository.persistAndFlush(competition);
  }

  async addBoulderingRound(
    competitionId: typeof Competition.prototype.id,
    dto: CreateBoulderingRoundDto,
  ): Promise<BoulderingRound> {
    const competition = await this.getOrFail(competitionId, [
      'boulderingRounds',
    ]);

    return this.boulderingService.createRound(competition, dto);
  }

  async addBoulderingResult(
    competitionId: typeof Competition.prototype.id,
    roundId: typeof BoulderingRound.prototype.id,
    boulderId: typeof Boulder.prototype.id,
    userId: typeof User.prototype.id,
    dto: CreateBoulderingResultDto,
  ): Promise<BoulderingResult> {
    const [, user] = await Promise.all([
      this.getOrFail(competitionId), // for validation only
      this.userService.getOrFail(userId),
    ]);

    return this.boulderingService.addResult(roundId, boulderId, user, dto);
  }
}
