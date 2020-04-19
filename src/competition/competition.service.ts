import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  NotImplementedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from 'nestjs-mikro-orm';
import { EntityRepository } from 'mikro-orm';
import {
  Competition,
  CompetitionRelation,
  CompetitionType,
  Ranking,
  UserCompetitionRelation,
} from './competition.entity';
import { CompetitionMapper } from '../shared/mappers/competition.mapper';
import { CreateCompetitionDTO } from './dto/in/body/create-competition.dto';
import { UserService } from '../user/user.service';
import { CompetitionRegistration } from '../shared/entity/competition-registration.entity';
import { User } from '../user/user.entity';
import { BoulderingRoundService } from '../bouldering/round/bouldering-round.service';
import {
  BoulderingRound,
  BoulderingRoundType,
} from '../bouldering/round/bouldering-round.entity';
import { CreateBoulderingResultDto } from './dto/in/body/create-bouldering-result.dto';
import { BoulderingResult } from '../bouldering/result/bouldering-result.entity';
import { CreateBoulderingRoundDto } from './dto/in/body/create-bouldering-round.dto';
import { Boulder } from '../bouldering/boulder/boulder.entity';

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
    private readonly boulderingRoundService: BoulderingRoundService,
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

    this.competitionRegistrationRepository.persistLater(
      new CompetitionRegistration(competition, user),
    );

    if (competition.type === CompetitionType.Bouldering) {
      const rounds = await competition.boulderingRounds.loadItems();
      const firstRound = rounds.find((r) => r.index === 0);

      if (firstRound) {
        await this.boulderingRoundService.addClimber(firstRound, user);
      }
    }

    await this.competitionRegistrationRepository.flush();
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
      'registrations',
    ]);

    return this.boulderingRoundService.createRound(competition, dto);
  }

  async addBoulderingResult(
    competitionId: typeof Competition.prototype.id,
    roundId: typeof BoulderingRound.prototype.id,
    boulderId: typeof Boulder.prototype.id,
    dto: CreateBoulderingResultDto,
  ): Promise<BoulderingResult> {
    const [competition, user] = await Promise.all([
      this.getOrFail(competitionId, ['registrations']),
      this.userService.getOrFail(dto.climberId),
    ]);

    const registrations = competition.registrations.getItems();
    const climberRegistered = registrations.find(
      (r) => r.climber.id === user.id,
    );

    if (!climberRegistered) {
      throw new UnprocessableEntityException('Climber not registered');
    }

    const result = await this.boulderingRoundService.addResult(
      roundId,
      boulderId,
      user,
      dto,
    );

    await this.updateRankings(competition);

    return result;
  }

  private getBoulderingRankings(
    rounds: BoulderingRound[],
  ): Map<typeof User.prototype.id, number> {
    const rankings = new Map<typeof User.prototype.id, number>();

    const qualifier = rounds.find(
      (r) => r.type === BoulderingRoundType.QUALIFIER,
    );

    const semiFinal = rounds.find(
      (r) => r.type === BoulderingRoundType.SEMI_FINAL,
    );

    const final = rounds.find((r) => r.type === BoulderingRoundType.FINAL);

    if (final && final.rankings) {
      for (const r of final.rankings.rankings) {
        rankings.set(r.climberId, r.ranking);
      }
    }

    if (semiFinal && semiFinal.rankings) {
      for (const r of semiFinal.rankings.rankings) {
        if (!rankings.has(r.climberId)) {
          rankings.set(r.climberId, r.ranking);
        }
      }
    }

    if (qualifier && qualifier.rankings) {
      for (const r of qualifier.rankings.rankings) {
        if (!rankings.has(r.climberId)) {
          rankings.set(r.climberId, r.ranking);
        }
      }
    }

    // TODO : handle ex aequos :)

    return rankings;
  }

  private async updateRankings(competition: Competition): Promise<void> {
    let rankings: Map<typeof User.prototype.id, number>;

    if (competition.type === CompetitionType.Bouldering) {
      rankings = this.getBoulderingRankings(
        await competition.boulderingRounds.loadItems(),
      );
    } else {
      throw new NotImplementedException();
    }

    const climbers = competition.registrations.getItems().map((r) => r.climber);

    competition.rankings = Array.from(
      rankings,
      ([climberId, ranking]): Ranking => {
        const climber = climbers.find((c) => c.id === climberId);

        if (!climber) {
          throw new InternalServerErrorException(
            'Climber not found when computing competition rankings',
          );
        }

        return {
          ranking,
          climber: {
            id: climberId,
            firstName: climber.firstName,
            lastName: climber.lastName,
            club: climber.club,
          },
        };
      },
    );

    await this.competitionRepository.persistAndFlush(competition);
  }

  async getRankings(
    competitionId: typeof Competition.prototype.id,
  ): Promise<Ranking[]> {
    const competition = await this.getOrFail(competitionId);
    return competition.rankings;
  }
}
