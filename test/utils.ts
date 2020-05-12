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
import { BoulderingGroup } from '../src/bouldering/group/bouldering-group.entity';
import { CompetitionRoundType } from '../src/competition/competition-round-type.enum';

// FIXME, cut this utils in multiple parts to remove ! assertions

export default class TestUtils {
  constructor(
    private readonly userService?: UserService,
    private readonly competitionService?: CompetitionService,
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
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
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
      quota: partialDto?.quota ?? 5,
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
      try: partialDto?.try ?? true,
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
    return this.orm!.em.findOneOrFail(BoulderingGroup, id);
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
}
