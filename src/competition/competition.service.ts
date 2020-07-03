import { Injectable, NotImplementedException } from '@nestjs/common';

import {
  ClimberRanking,
  Competition,
  CompetitionRelation,
  Rankings,
  UserCompetitionRelation,
} from './competition.entity';

import {
  OffsetLimitRequest,
  OffsetLimitResponse,
} from '../shared/pagination/pagination.service';

import {
  BoulderingRound,
  BoulderingRoundRankings,
  BoulderingRoundState,
} from '../bouldering/round/bouldering-round.entity';

import {
  BoulderingGroup,
  BoulderingGroupRankings,
  BoulderingGroupState,
} from '../bouldering/group/bouldering-group.entity';

import {
  getRankingDiff,
  RankingDiffInput,
  RankingsDiff,
} from '../bouldering/ranking/ranking.utils';

import { InjectRepository } from 'nestjs-mikro-orm';
import { EntityRepository } from 'mikro-orm';
import { CompetitionMapper } from '../shared/mappers/competition.mapper';
import { CreateCompetitionDTO } from './dto/in/body/create-competition.dto';
import { UserService } from '../user/user.service';
import { CompetitionRegistration } from '../shared/entity/competition-registration.entity';
import { User } from '../user/user.entity';
import { BoulderingRoundService } from '../bouldering/round/bouldering-round.service';
import { CreateBoulderingResultDto } from './dto/in/body/create-bouldering-result.dto';
import { BoulderingResult } from '../bouldering/result/bouldering-result.entity';
import { CreateBoulderingRoundDto } from './dto/in/body/create-bouldering-round.dto';
import { Boulder } from '../bouldering/boulder/boulder.entity';
import { BoulderingRankingService } from '../bouldering/ranking/bouldering-ranking.service';
import { CompetitionType } from './types/competition-type.enum';
import { Category } from '../shared/types/category.interface';
import { UpdateCompetitionByIdDto } from './dto/in/body/update-competition-by-id.dto';
import { SearchQuery } from '../shared/decorators/search.decorator';
import { CreateBoulderDto } from './dto/in/body/create-boulder.dto';
import { CreateBoulderingGroupDto } from './dto/in/body/create-bouldering-group.dto';
import { CompetitionRoundType } from './competition-round-type.enum';
import { UpdateBoulderingRoundDto } from './dto/in/body/update-bouldering-round.dto';
import { CompetitionNotFoundError } from './errors/competition-not-found.error';
import { RegistrationsClosedError } from './errors/registrations-closed.error';
import { AlreadyRegisteredError } from './errors/already-registered.error';
import { RegistrationNotFoundError } from './errors/registration-not-found.error';
import { UserAlreadyHasRoleError } from './errors/user-already-has-role.error';
import { UserNotFoundWithRoleError } from './errors/user-not-found-with-role.error';
import { RemoveLastOrganizerError } from './errors/remove-last-organizer.error';
import { OrganizerNotFoundError } from './errors/organizer-not-found.error';
import { ClimberNotRegisteredError } from './errors/climber-not-registered.error';
import { RoundNotFoundError } from '../bouldering/errors/round-not-found.error';
import { RankingsNotFoundError } from './errors/rankings-not-found.error';
import { RoundByCategoryByType } from './types/round-by-category-by-type.type';
import { NoPreviousRoundRankingsError } from './errors/no-previous-round-rankings.error';
import { BulkBoulderingResultsDto } from './dto/in/body/bulk-bouldering-results.dto';
import { EventEmitter as EE } from 'ee-ts';
import ReadableStream = NodeJS.ReadableStream;
import { PdfService } from '../pdf/pdf.service';

export interface CompetitionRankingsUpdateEventPayload {
  competitionId: typeof Competition.prototype.id;
  category: Category;
  rankings: ClimberRanking[];
  diff: RankingsDiff[];
}

export interface CompetitionServiceEvents {
  rankingsUpdate(payload: CompetitionRankingsUpdateEventPayload): void;
}

@Injectable()
export class CompetitionService extends EE<CompetitionServiceEvents> {
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
    private readonly boulderingRankingService: BoulderingRankingService,
    private readonly pdfService: PdfService,
  ) {
    super();
  }

  async getOrFail(
    competitionId: typeof Competition.prototype.id,
    populate?: CompetitionRelation[],
  ): Promise<Competition> {
    const competition = await this.competitionRepository.findOne(
      competitionId,
      populate,
    );

    if (!competition) {
      throw new CompetitionNotFoundError();
    }

    return competition;
  }

  async getCompetitions(
    offsetLimitRequest: OffsetLimitRequest,
    search: SearchQuery<Competition>,
  ): Promise<OffsetLimitResponse<Competition>> {
    const [competitions, total] = await this.competitionRepository.findAndCount(
      search.filter,
      {
        limit: offsetLimitRequest.limit,
        offset: offsetLimitRequest.offset,
        orderBy: search.order,
      },
    );

    return {
      total,
      data: competitions,
    };
  }

  async create(dto: CreateCompetitionDTO, owner: User): Promise<Competition> {
    const newCompetition = new Competition(
      dto.name,
      dto.type,
      dto.description,
      dto.agenda,
      dto.open,
      dto.welcomingDate,
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

  async updateById(
    competitionId: typeof Competition.prototype.id,
    dto: UpdateCompetitionByIdDto,
  ): Promise<Competition> {
    const competition = await this.getOrFail(competitionId);
    Object.assign(competition, dto);
    await this.competitionRepository.persistAndFlush(competition);
    return competition;
  }

  private async isRegistered(
    climber: User,
    competition: Competition,
  ): Promise<boolean> {
    const count = await this.competitionRegistrationRepository.count({
      competition,
      climber,
    });

    return count === 1;
  }

  async register(
    competitionId: typeof Competition.prototype.id,
    userId: typeof User.prototype.id,
  ): Promise<void> {
    const competition = await this.getOrFail(competitionId, [
      // eslint-disable-next-line sonarjs/no-duplicate-string
      'boulderingRounds.groups.climbers',
    ]);

    if (!competition.takesRegistrations()) {
      throw new RegistrationsClosedError();
    }

    const user = await this.userService.getOrFail(userId);

    if (await this.isRegistered(user, competition)) {
      throw new AlreadyRegisteredError();
    }

    this.competitionRegistrationRepository.persistLater(
      new CompetitionRegistration(competition, user),
    );

    if (competition.type === CompetitionType.Bouldering) {
      const season = competition.getSeason();
      const climberCategory = user.getCategory(season);
      const qualifierRound = competition.getQualifierRound(climberCategory);

      if (qualifierRound && qualifierRound.takesNewClimbers()) {
        await this.boulderingRoundService.addClimbers(qualifierRound, user);
      }
    }

    await this.competitionRegistrationRepository.flush();
  }

  async getRegistrations(
    offsetLimitRequest: OffsetLimitRequest,
    competitionId: typeof Competition.prototype.id,
  ): Promise<OffsetLimitResponse<CompetitionRegistration>> {
    const competition = await this.getOrFail(competitionId);

    const [
      registrations,
      total,
    ] = await this.competitionRegistrationRepository.findAndCount(
      {
        competition,
      },
      {
        limit: offsetLimitRequest.limit,
        offset: offsetLimitRequest.offset,
      },
    );

    return {
      data: registrations,
      total,
    };
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
      throw new RegistrationNotFoundError();
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
      throw new UserAlreadyHasRoleError(relation);
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
      throw new UserNotFoundWithRoleError(relation);
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
        throw new RemoveLastOrganizerError();
      } else {
        competition.organizers.remove(user);
      }
    } else {
      throw new OrganizerNotFoundError();
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
    groupId: typeof BoulderingGroup.prototype.id,
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
      throw new ClimberNotRegisteredError();
    }

    const result = await this.boulderingRoundService.addResult(
      roundId,
      groupId,
      boulderId,
      user,
      dto,
    );

    await this.updateMainRankingsForCategory(
      competition,
      user.getCategory(competition.getSeason()),
    );

    return result;
  }

  async getBoulderingResult(
    competitionId: typeof Competition.prototype.id,
    roundId: typeof BoulderingRound.prototype.id,
    groupId: typeof BoulderingGroup.prototype.id,
    boulderId: typeof Boulder.prototype.id,
    climberId: typeof User.prototype.id,
  ): Promise<BoulderingResult> {
    const [{ round }, climber] = await Promise.all([
      this.getBoulderingRoundOrFail(competitionId, roundId),
      this.userService.getOrFail(climberId),
    ]);

    return this.boulderingRoundService.getBoulderingResult(
      round,
      groupId,
      boulderId,
      climber,
    );
  }

  private mapRankingsForDiff(rankings: ClimberRanking[]): RankingDiffInput[] {
    return rankings.map((r) => ({
      climberId: r.climber.id,
      ranking: r.ranking,
    }));
  }

  private async updateMainRankingsForCategory(
    competition: Competition,
    category: Category,
  ): Promise<void> {
    let rankings: Map<typeof User.prototype.id, number>;

    if (competition.type === CompetitionType.Bouldering) {
      const rounds = (
        await competition.boulderingRounds.init({
          populate: ['groups'],
        })
      ).getItems();

      const categoryRounds = rounds.filter(
        (r) => r.category === category.name && r.sex === category.sex,
      );

      rankings = this.boulderingRankingService.getRankings(categoryRounds);
    } else {
      throw new NotImplementedException();
    }

    const season = competition.getSeason();
    await competition.registrations.init();

    const climbers = competition.registrations
      .getItems()
      .filter((r) => {
        const climberCategory = r.climber.getCategory(season);

        return (
          climberCategory.sex === category.sex &&
          climberCategory.name === category.name
        );
      })
      .map((r) => r.climber);

    const rankingsByCategory = (competition.rankings[category.name] =
      competition.rankings[category.name] ?? {});

    const oldRankings = rankingsByCategory[category.sex];

    rankingsByCategory[category.sex] = Array.from(
      rankings,
      ([climberId, ranking]) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const climber = climbers.find((c) => c.id === climberId)!;

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

    this.emit('rankingsUpdate', {
      competitionId: competition.id,
      rankings: competition.rankings[category.name]![category.sex]!,
      category,
      diff: getRankingDiff(
        oldRankings ? this.mapRankingsForDiff(oldRankings) : [],
        this.mapRankingsForDiff(
          competition.rankings[category.name]![category.sex]!,
        ),
      ),
    });

    await this.competitionRepository.persistAndFlush(competition);
  }

  async getRankings(
    competitionId: typeof Competition.prototype.id,
  ): Promise<Rankings> {
    const competition = await this.getOrFail(competitionId);
    return competition.rankings;
  }

  private async getBoulderingRoundOrFail(
    competitionId: typeof Competition.prototype.id,
    roundId: typeof BoulderingRound.prototype.id,
    populate?: string[],
  ): Promise<{
    round: BoulderingRound;
    competition: Competition;
  }> {
    const competition = await this.getOrFail(competitionId);

    const rounds = await competition.boulderingRounds.init({
      where: {
        id: roundId,
      },
      populate,
    });

    const round = rounds.getItems()[0];

    if (!round) {
      throw new RoundNotFoundError();
    }

    return {
      competition,
      round,
    };
  }

  async createBoulder(
    competitionId: typeof Competition.prototype.id,
    roundId: typeof BoulderingRound.prototype.id,
    groupId: typeof BoulderingGroup.prototype.id,
    dto: CreateBoulderDto,
  ): Promise<Boulder> {
    const { round } = await this.getBoulderingRoundOrFail(
      competitionId,
      roundId,
    );

    return this.boulderingRoundService.createBoulder(round, groupId, dto);
  }

  async deleteBoulder(
    competitionId: typeof Competition.prototype.id,
    roundId: typeof BoulderingRound.prototype.id,
    groupId: typeof BoulderingGroup.prototype.id,
    boulderId: typeof Boulder.prototype.id,
  ): Promise<void> {
    const { round } = await this.getBoulderingRoundOrFail(
      competitionId,
      roundId,
    );

    return this.boulderingRoundService.removeBoulder(round, groupId, boulderId);
  }

  async getBoulderingRoundRankings(
    competitionId: typeof Competition.prototype.id,
    roundId: typeof BoulderingRound.prototype.id,
  ): Promise<BoulderingRoundRankings> {
    const { round } = await this.getBoulderingRoundOrFail(
      competitionId,
      roundId,
    );

    if (!round.rankings) {
      throw new RankingsNotFoundError();
    }

    return round.rankings;
  }

  async getBoulderingGroupRankings(
    competitionId: typeof Competition.prototype.id,
    roundId: typeof BoulderingRound.prototype.id,
    groupId: typeof BoulderingGroup.prototype.id,
  ): Promise<BoulderingGroupRankings> {
    const { round } = await this.getBoulderingRoundOrFail(
      competitionId,
      roundId,
    );

    return this.boulderingRoundService.getGroupRankings(round, groupId);
  }

  async createBoulderingGroup(
    competitionId: typeof Competition.prototype.id,
    roundId: typeof BoulderingRound.prototype.id,
    dto: CreateBoulderingGroupDto,
  ): Promise<BoulderingGroup> {
    const { round } = await this.getBoulderingRoundOrFail(
      competitionId,
      roundId,
    );

    return this.boulderingRoundService.createGroup(round, dto);
  }

  async deleteBoulderingGroup(
    competitionId: typeof Competition.prototype.id,
    roundId: typeof BoulderingRound.prototype.id,
    groupId: typeof BoulderingGroup.prototype.id,
  ): Promise<void> {
    const { round } = await this.getBoulderingRoundOrFail(
      competitionId,
      roundId,
    );

    return this.boulderingRoundService.deleteGroup(round, groupId);
  }

  async deleteBoulderingRound(
    competitionId: typeof Competition.prototype.id,
    roundId: typeof BoulderingRound.prototype.id,
  ): Promise<void> {
    const { round } = await this.getBoulderingRoundOrFail(
      competitionId,
      roundId,
    );

    await this.boulderingRoundService.delete(round);
  }

  count(search: SearchQuery<Competition>): Promise<number> {
    return this.competitionRepository.count(search.filter);
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  private async startRoundsByType(
    competitionId: typeof Competition.prototype.id,
    type: CompetitionRoundType,
  ): Promise<BoulderingRound[]> {
    const competition = await this.getOrFail(competitionId, [
      'boulderingRounds.groups.climbers',
    ]);

    const rounds = competition.boulderingRounds.getItems();

    const startedRounds = rounds.filter(
      (r) => r.type === type && r.state === BoulderingRoundState.PENDING,
    );

    for (const r of startedRounds) {
      const previousRound = competition.getPreviousRound(r);

      if (previousRound) {
        if (!previousRound.rankings) {
          throw new NoPreviousRoundRankingsError();
        }

        if (previousRound.quota > 0) {
          const getClimberJobs: Promise<User>[] = [];

          for (let i = 1; i <= previousRound.quota; i++) {
            for (const ranking of previousRound.rankings.rankings) {
              const rank = ranking;

              if (rank.ranking === i) {
                getClimberJobs.push(
                  this.userService.getOrFail(rank.climber.id),
                );
              }
            }
          }

          const climbers = await Promise.all(getClimberJobs);
          await this.boulderingRoundService.addClimbers(r, ...climbers);
        }

        for (const group of previousRound.groups.getItems()) {
          group.state = BoulderingGroupState.ENDED;
        }

        this.competitionRepository.persistLater(previousRound);
      }

      for (const group of r.groups.getItems()) {
        group.state = BoulderingGroupState.ONGOING;
      }

      this.competitionRepository.persistLater(r);
    }

    await this.competitionRepository.flush();
    return startedRounds;
  }

  startQualifiers(
    competitionId: typeof Competition.prototype.id,
  ): Promise<BoulderingRound[]> {
    return this.startRoundsByType(
      competitionId,
      CompetitionRoundType.QUALIFIER,
    );
  }

  startSemiFinals(
    competitionId: typeof Competition.prototype.id,
  ): Promise<BoulderingRound[]> {
    return this.startRoundsByType(
      competitionId,
      CompetitionRoundType.SEMI_FINAL,
    );
  }

  startFinals(
    competitionId: typeof Competition.prototype.id,
  ): Promise<BoulderingRound[]> {
    return this.startRoundsByType(competitionId, CompetitionRoundType.FINAL);
  }

  async updateBoulderingRound(
    competitionId: typeof Competition.prototype.id,
    roundId: typeof BoulderingRound.prototype.id,
    dto: UpdateBoulderingRoundDto,
  ): Promise<BoulderingRound> {
    const {
      competition,
      round,
    } = await this.getBoulderingRoundOrFail(competitionId, roundId, ['groups']);

    return this.boulderingRoundService.update(competition, round, dto);
  }

  async getBoulderingRoundsByCategoryByType(
    competitionId: typeof Competition.prototype.id,
  ): Promise<RoundByCategoryByType<BoulderingRound>> {
    const { boulderingRounds } = await this.getOrFail(competitionId, [
      'boulderingRounds.groups',
    ]);

    const roundsByCategoryByType: RoundByCategoryByType<BoulderingRound> = {};

    for (const round of boulderingRounds.getItems()) {
      const roundByCategoryName = (roundsByCategoryByType[round.category] =
        roundsByCategoryByType[round.category] ?? {});

      const roundByCategory = (roundByCategoryName[round.sex] =
        roundByCategoryName[round.sex] ?? {});

      roundByCategory[round.type] = round;
    }

    return roundsByCategoryByType;
  }

  async assignJudgeToBoulder(
    competitionId: typeof Competition.prototype.id,
    roundId: typeof BoulderingRound.prototype.id,
    groupId: typeof BoulderingGroup.prototype.id,
    boulderId: typeof Boulder.prototype.id,
    judgeId: typeof User.prototype.id,
  ): Promise<void> {
    const { round } = await this.getBoulderingRoundOrFail(
      competitionId,
      roundId,
    );

    return this.boulderingRoundService.assignJudgeToBoulder(
      round,
      groupId,
      boulderId,
      judgeId,
    );
  }

  async removeJudgeAssignmentToBoulder(
    competitionId: typeof Competition.prototype.id,
    roundId: typeof BoulderingRound.prototype.id,
    groupId: typeof BoulderingGroup.prototype.id,
    boulderId: typeof Boulder.prototype.id,
    judgeId: typeof User.prototype.id,
  ): Promise<void> {
    const { round } = await this.getBoulderingRoundOrFail(
      competitionId,
      roundId,
    );

    return this.boulderingRoundService.removeJudgeAssignmentToBoulder(
      round,
      groupId,
      boulderId,
      judgeId,
    );
  }

  async getGroupBoulders(
    competitionId: typeof Competition.prototype.id,
    roundId: typeof BoulderingRound.prototype.id,
    groupId: typeof BoulderingGroup.prototype.id,
  ): Promise<Boulder[]> {
    const { round } = await this.getBoulderingRoundOrFail(
      competitionId,
      roundId,
    );

    return this.boulderingRoundService.getGroupBoulders(round, groupId);
  }

  async getBoulderingGroups(
    competitionId: typeof Competition.prototype.id,
    roundId: typeof BoulderingRound.prototype.id,
  ): Promise<BoulderingGroup[]> {
    const { round } = await this.getBoulderingRoundOrFail(
      competitionId,
      roundId,
      ['groups.climbers', 'groups.boulders.judges'],
    );

    return round.groups.getItems();
  }

  async bulkBoulderingResults(
    competitionId: typeof Competition.prototype.id,
    roundId: typeof BoulderingRound.prototype.id,
    groupId: typeof BoulderingGroup.prototype.id,
    dto: BulkBoulderingResultsDto,
  ): Promise<BoulderingGroupRankings> {
    const { competition, round } = await this.getBoulderingRoundOrFail(
      competitionId,
      roundId,
    );

    const groupRankings = await this.boulderingRoundService.bulkGroupResults(
      round,
      groupId,
      dto,
    );

    await this.updateMainRankingsForCategory(competition, {
      name: round.category,
      sex: round.sex,
    });

    return groupRankings;
  }

  async getRankingsPdf(
    competitionId: typeof Competition.prototype.id,
  ): Promise<ReadableStream> {
    const competition = await this.getOrFail(competitionId, [
      'boulderingRounds.groups.climbers',
      'boulderingRounds.groups.boulders',
    ]);

    return this.pdfService.generateCompetitionPdf(competition);
  }

  async getBoulderingRoundRankingsPdf(
    competitionId: typeof Competition.prototype.id,
    roundId: typeof BoulderingRound.prototype.id,
  ): Promise<ReadableStream> {
    const { round } = await this.getBoulderingRoundOrFail(
      competitionId,
      roundId,
      ['groups.climbers', 'groups.boulders'],
    );

    return this.pdfService.generateBoulderingRoundPdf(round);
  }
}
