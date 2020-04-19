import { RegisterDto } from '../src/user/dto/in/body/register.dto';
import * as uuid from 'uuid';
import { TokenResponseDto } from '../src/user/dto/out/token-response.dto';
import { CredentialsDto } from '../src/user/dto/in/body/credentials.dto';
import { CreateCompetitionDTO } from '../src/competition/dto/in/body/create-competition.dto';
import { MikroORM } from 'mikro-orm';
import { User } from '../src/user/user.entity';
import { SystemRole } from '../src/user/user-role.enum';

import {
  CategoryName,
  Competition,
  CompetitionType,
  Sex,
} from '../src/competition/competition.entity';

import { UserService } from '../src/user/user.service';
import { CompetitionService } from '../src/competition/competition.service';
import { CompetitionRegistration } from '../src/shared/entity/competition-registration.entity';
import { CreateBoulderingRoundDto } from '../src/competition/dto/in/body/create-bouldering-round.dto';
import {
  BoulderingRound,
  BoulderingRoundRankingType,
  BoulderingRoundType,
} from '../src/bouldering/round/bouldering-round.entity';
import { CreateBoulderingResultDto } from '../src/competition/dto/in/body/create-bouldering-result.dto';
import { Boulder } from '../src/bouldering/boulder/boulder.entity';

// FIXME, cut this utils in multiple parts to remove ts-ignore comments
/* eslint-disable @typescript-eslint/ban-ts-ignore */

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
    // @ts-ignore
    this.orm.em.clear();
  }

  async givenUser(): Promise<{
    user: User;
    credentials: CredentialsDto;
  }> {
    const registerDto: RegisterDto = {
      firstName: uuid.v4(),
      lastName: uuid.v4(),
      email: `${uuid.v4()}@${uuid.v4()}.fr`,
      password: uuid.v4().substr(0, 10),
    };

    return {
      // @ts-ignore
      user: await this.userService.register(registerDto),
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
    };

    // @ts-ignore
    const res = await this.userService.register(registerDto);

    // @ts-ignore
    const userEntity = await this.orm.em.findOneOrFail(User, res.id);
    userEntity.systemRole = SystemRole.Admin;

    // @ts-ignore
    await this.orm.em.persistAndFlush(userEntity);

    return {
      user: userEntity,
      credentials: registerDto,
    };
  }

  givenCompetitionData(
    competitionData?: Partial<Competition>,
  ): CreateCompetitionDTO {
    const now = new Date();

    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );

    const tomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );

    tomorrow.setDate(tomorrow.getDate() + 1);

    return {
      address: competitionData?.address ?? uuid.v4(),
      categories: competitionData?.categories ?? [
        {
          sex: Sex.Male,
          name: CategoryName.Minime,
        },
      ],
      city: competitionData?.city ?? uuid.v4(),
      name: competitionData?.name ?? uuid.v4(),
      postalCode: competitionData?.postalCode ?? uuid.v4(),
      type: competitionData?.type ?? CompetitionType.Lead,
      startDate: competitionData?.startDate ?? today,
      endDate: competitionData?.endDate ?? tomorrow,
    };
  }

  async givenCompetition(
    user: User,
    competitionData?: Partial<Competition>,
  ): Promise<Competition> {
    // @ts-ignore
    return this.competitionService.create(
      this.givenCompetitionData(competitionData),
      user,
    );
  }

  login(credentials: CredentialsDto): Promise<TokenResponseDto> {
    // @ts-ignore
    return this.userService.login(credentials);
  }

  async registerUserInCompetition(
    user: User,
    competition: Competition,
  ): Promise<void> {
    // @ts-ignore
    await this.competitionService.register(competition.id, user.id);
  }

  getRegistrations(
    competition: Competition,
  ): Promise<CompetitionRegistration[]> {
    // @ts-ignore
    return this.competitionService.getRegistrations(competition.id);
  }

  async addJuryPresidentInCompetition(
    user: User,
    competition: Competition,
  ): Promise<void> {
    // @ts-ignore
    await this.competitionService.addJuryPresident(competition.id, user.id);
  }

  getJuryPresidents(competition: Competition): Promise<User[]> {
    // @ts-ignore
    return this.competitionService.getJuryPresidents(competition.id);
  }

  async addJudgeInCompetition(
    user: User,
    competition: Competition,
  ): Promise<void> {
    // @ts-ignore
    await this.competitionService.addJudge(competition.id, user.id);
  }

  async getJudges(competition: Competition): Promise<User[]> {
    // @ts-ignore
    return await this.competitionService.getJudges(competition.id);
  }

  async addChiefRouteSetterInCompetition(
    user: User,
    competition: Competition,
  ): Promise<void> {
    // @ts-ignore
    await this.competitionService.addChiefRouteSetter(competition.id, user.id);
  }

  getChiefRouteSetters(competition: Competition): Promise<User[]> {
    // @ts-ignore
    return this.competitionService.getChiefRouteSetters(competition.id);
  }

  async addRouteSetterInCompetition(
    user: User,
    competition: Competition,
  ): Promise<void> {
    // @ts-ignore
    await this.competitionService.addRouteSetter(competition.id, user.id);
  }

  getRouteSetters(competition: Competition): Promise<User[]> {
    // @ts-ignore
    return this.competitionService.getRouteSetters(competition.id);
  }

  async addTechnicalDelegateInCompetition(
    user: User,
    competition: Competition,
  ): Promise<void> {
    // @ts-ignore
    await this.competitionService.addTechnicalDelegate(competition.id, user.id);
  }

  getTechnicalDelegates(competition: Competition): Promise<User[]> {
    // @ts-ignore
    return this.competitionService.getTechnicalDelegates(competition.id);
  }

  async addOrganizerInCompetition(
    user: User,
    competition: Competition,
  ): Promise<void> {
    // @ts-ignore
    await this.competitionService.addOrganizer(competition.id, user.id);
  }

  getOrganizers(competition: Competition): Promise<User[]> {
    // @ts-ignore
    return this.competitionService.getOrganizers(competition.id);
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
      type: partialDto?.type ?? BoulderingRoundType.QUALIFIER,
    };

    // @ts-ignore
    return this.competitionService.addBoulderingRound(competition.id, dto);
  }

  addBoulderingResult(
    competition: Competition,
    round: BoulderingRound,
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

    // @ts-ignore
    return this.competitionService.addBoulderingResult(
      competition.id,
      round.id,
      boulder.id,
      dto,
    );
  }
}
