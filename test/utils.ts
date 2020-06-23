import { RegisterDto } from '../src/user/dto/in/body/register.dto';
import * as uuid from 'uuid';
import { TokenResponseDto } from '../src/user/dto/out/token-response.dto';
import { CredentialsDto } from '../src/user/dto/in/body/credentials.dto';
import { MikroORM } from 'mikro-orm';
import { User } from '../src/user/user.entity';
import { SystemRole } from '../src/user/user-role.enum';
import { Competition } from '../src/competition/competition.entity';
import { UserService } from '../src/user/user.service';
import { CompetitionService } from '../src/competition/competition.service';
import { CompetitionRegistration } from '../src/shared/entity/competition-registration.entity';
import { CreateBoulderingRoundDto } from '../src/competition/dto/in/body/create-bouldering-round.dto';
import {
  BoulderingRound,
  BoulderingRoundRankingType,
} from '../src/bouldering/round/bouldering-round.entity';
import { CreateBoulderingResultDto } from '../src/competition/dto/in/body/create-bouldering-result.dto';
import { Boulder } from '../src/bouldering/boulder/boulder.entity';
import { givenCreateCompetitionDto } from './fixture/competition.fixture';
import { Sex } from '../src/shared/types/sex.enum';
import { CategoryName } from '../src/shared/types/category-name.enum';
import {
  BoulderingGroup,
  BoulderingGroupState,
} from '../src/bouldering/group/bouldering-group.entity';
import { CompetitionRoundType } from '../src/competition/competition-round-type.enum';
import { BoulderService } from '../src/bouldering/boulder/boulder.service';
import { CompetitionType } from '../src/competition/types/competition-type.enum';

// FIXME, cut this utils in multiple parts to remove ! assertions

export default class TestUtils {
  constructor(
    private readonly userService?: UserService,
    private readonly competitionService?: CompetitionService,
    private readonly boulderService?: BoulderService,
    private readonly orm?: MikroORM,
  ) {}

  /**
   * Clear ORM to make sure that this instance is up to date
   */
  clearORM(): void {
    this.orm!.em.clear();
  }

  async givenUser(
    data?: Partial<RegisterDto>,
  ): Promise<{
    user: User;
    credentials: CredentialsDto;
  }> {
    const registerDto: RegisterDto = {
      firstName: data?.firstName ?? uuid.v4(),
      lastName: data?.lastName ?? uuid.v4(),
      email: data?.email ?? `${uuid.v4()}@${uuid.v4()}.fr`,
      password: data?.password ?? uuid.v4().substr(0, 10),
      birthYear: data?.birthYear ?? 2000,
      sex: data?.sex ?? Sex.Female,
      club: data?.club ?? uuid.v4(),
    };

    return {
      user: await this.userService!.register(registerDto),
      credentials: registerDto,
    };
  }

  async givenAdminUser(): Promise<{
    user: User;
    credentials: CredentialsDto;
  }> {
    const registerDto: RegisterDto = {
      firstName: uuid.v4(),
      lastName: uuid.v4(),
      email: `${uuid.v4()}@${uuid.v4()}.fr`,
      password: uuid.v4().substr(0, 10),
      birthYear: 2000,
      sex: Sex.Female,
      club: uuid.v4(),
    };

    const res = await this.userService!.register(registerDto);

    const userEntity = await this.orm!.em.findOneOrFail(User, res.id);
    userEntity.systemRole = SystemRole.Admin;

    await this.orm!.em.persistAndFlush(userEntity);

    return {
      user: userEntity,
      credentials: registerDto,
    };
  }

  async givenCompetition(
    user: User,
    competitionData?: Partial<Competition>,
  ): Promise<Competition> {
    return this.competitionService!.create(
      givenCreateCompetitionDto(competitionData),
      user,
    );
  }

  login(credentials: CredentialsDto): Promise<TokenResponseDto> {
    return this.userService!.login(credentials);
  }

  async registerUserInCompetition(
    user: User,
    competition: Competition,
  ): Promise<void> {
    await this.competitionService!.register(competition.id, user.id);
  }

  async getRegistrations(
    competition: Competition,
  ): Promise<CompetitionRegistration[]> {
    const { data } = await this.competitionService!.getRegistrations(
      {
        offset: 0,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        limit: undefined,
      },
      competition.id,
    );

    return data;
  }

  async addJuryPresidentInCompetition(
    user: User,
    competition: Competition,
  ): Promise<void> {
    await this.competitionService!.addJuryPresident(competition.id, user.id);
  }

  getJuryPresidents(competition: Competition): Promise<User[]> {
    return this.competitionService!.getJuryPresidents(competition.id);
  }

  async addJudgeInCompetition(
    user: User,
    competition: Competition,
  ): Promise<void> {
    await this.competitionService!.addJudge(competition.id, user.id);
  }

  async getJudges(competition: Competition): Promise<User[]> {
    return await this.competitionService!.getJudges(competition.id);
  }

  async addChiefRouteSetterInCompetition(
    user: User,
    competition: Competition,
  ): Promise<void> {
    await this.competitionService!.addChiefRouteSetter(competition.id, user.id);
  }

  getChiefRouteSetters(competition: Competition): Promise<User[]> {
    return this.competitionService!.getChiefRouteSetters(competition.id);
  }

  async addRouteSetterInCompetition(
    user: User,
    competition: Competition,
  ): Promise<void> {
    await this.competitionService!.addRouteSetter(competition.id, user.id);
  }

  getRouteSetters(competition: Competition): Promise<User[]> {
    return this.competitionService!.getRouteSetters(competition.id);
  }

  async addTechnicalDelegateInCompetition(
    user: User,
    competition: Competition,
  ): Promise<void> {
    await this.competitionService!.addTechnicalDelegate(
      competition.id,
      user.id,
    );
  }

  getTechnicalDelegates(competition: Competition): Promise<User[]> {
    return this.competitionService!.getTechnicalDelegates(competition.id);
  }

  async addOrganizerInCompetition(
    user: User,
    competition: Competition,
  ): Promise<void> {
    await this.competitionService!.addOrganizer(competition.id, user.id);
  }

  getOrganizers(competition: Competition): Promise<User[]> {
    return this.competitionService!.getOrganizers(competition.id);
  }

  getRandomId(): number {
    return Math.floor(Math.random() * 100000);
  }

  addBoulderingRound(
    competition: Competition,
    partialDto?: Partial<CreateBoulderingRoundDto>,
  ): Promise<BoulderingRound> {
    const dto: CreateBoulderingRoundDto = {
      boulders: partialDto?.boulders ?? 4,
      name: partialDto?.name ?? String(Math.random()),
      rankingType:
        partialDto?.rankingType ?? BoulderingRoundRankingType.CIRCUIT,
      type: partialDto?.type ?? CompetitionRoundType.QUALIFIER,
      category: partialDto?.category ?? CategoryName.Minime,
      sex: partialDto?.sex ?? Sex.Female,
      maxTries: partialDto?.maxTries,
    };

    return this.competitionService!.addBoulderingRound(competition.id, dto);
  }

  addBoulderingResult(
    competition: Competition,
    round: BoulderingRound,
    group: BoulderingGroup,
    boulder: Boulder,
    climber: User,
    partialDto?: Partial<CreateBoulderingResultDto>,
  ): Promise<unknown> {
    const dto: CreateBoulderingResultDto = {
      climberId: climber.id,
      top: partialDto?.top ?? false,
      zone: partialDto?.zone ?? false,
      try: partialDto?.try ?? 1,
    };

    return this.competitionService!.addBoulderingResult(
      competition.id,
      round.id,
      group.id,
      boulder.id,
      dto,
    );
  }

  getBoulderingGroup(
    id: typeof BoulderingGroup.prototype.id,
  ): Promise<BoulderingGroup> {
    return this.orm!.em.findOneOrFail(BoulderingGroup, id, ['climbers']);
  }

  getBoulderingRound(
    id: typeof BoulderingRound.prototype.id,
  ): Promise<BoulderingRound | null> {
    return this.orm!.em.findOne(BoulderingRound, id);
  }

  async getBoulderJudges(
    boulderId: typeof Boulder.prototype.id,
  ): Promise<User[]> {
    const boulder = await this.orm!.em.findOneOrFail(Boulder, boulderId, [
      'judges',
    ]);

    return boulder.judges.getItems();
  }

  async assignJudgeToBoulder(judge: User, boulder: Boulder): Promise<void> {
    await this.boulderService!.assignJudge(boulder, judge.id);
  }

  async updateBoulderingGroupState(
    boulderingGroup: BoulderingGroup,
    state: BoulderingGroupState,
  ): Promise<void> {
    const group = await this.orm!.em.findOneOrFail(
      BoulderingGroup,
      boulderingGroup.id,
    );

    group.state = state;
    await this.orm!.em.persistAndFlush(group);
  }

  async startQualifiers(competition: Competition): Promise<void> {
    await this.competitionService!.startQualifiers(competition.id);
  }

  async startSemiFinals(competition: Competition): Promise<void> {
    await this.competitionService!.startSemiFinals(competition.id);
  }

  async givenReadyCompetition(
    rankingType: BoulderingRoundRankingType,
    roundData?: Partial<BoulderingRound>,
  ): Promise<{
    competition: Competition;
    organizer: User;
    climber: User;
    judge: User;
    judgeAuth: TokenResponseDto;
    boulder: Boulder;
    round: BoulderingRound;
    juryPresident: User;
    juryPresidentAuth: TokenResponseDto;
  }> {
    const { user: organizer } = await this.givenUser();
    const { user: climber } = await this.givenUser({
      sex: Sex.Female,
      birthYear: 2000,
    });

    const {
      user: judge,
      credentials: judgeCredentials,
    } = await this.givenUser();

    const judgeAuth = await this.login(judgeCredentials);

    const {
      user: juryPresident,
      credentials: juryPresidentCredentials,
    } = await this.givenUser();

    const juryPresidentAuth = await this.login(juryPresidentCredentials);

    const competition = await this.givenCompetition(organizer, {
      type: CompetitionType.Bouldering,
      startDate: new Date(2014, 10, 1),
    });

    await this.registerUserInCompetition(climber, competition);
    await this.addJudgeInCompetition(judge, competition);
    await this.addJuryPresidentInCompetition(juryPresident, competition);

    const round = await this.addBoulderingRound(competition, {
      rankingType,
      type: CompetitionRoundType.QUALIFIER,
      boulders: 1,
      sex: Sex.Female,
      category: CategoryName.Minime,
      maxTries: roundData?.maxTries,
    });

    await this.updateBoulderingGroupState(
      round.groups.getItems()[0],
      BoulderingGroupState.ONGOING,
    );

    const boulder = round.groups.getItems()[0].boulders.getItems()[0];

    await this.assignJudgeToBoulder(judge, boulder);

    this.clearORM();

    return {
      competition,
      organizer,
      climber,
      judge,
      judgeAuth,
      boulder,
      round,
      juryPresident,
      juryPresidentAuth,
    };
  }
}
