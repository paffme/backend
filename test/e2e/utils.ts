import { RegisterDto } from '../../src/user/dto/in/body/register.dto';
import * as uuid from 'uuid';
import { TokenResponseDto } from '../../src/user/dto/out/token-response.dto';
import { CredentialsDto } from '../../src/user/dto/in/body/credentials.dto';
import { UserDto } from '../../src/user/dto/out/user.dto';
import { CreateCompetitionDTO } from '../../src/competition/dto/in/body/create-competition.dto';
import { CompetitionDto } from '../../src/competition/dto/out/competition.dto';
import { CreateCompetitionRegistrationDto } from '../../src/competition/dto/in/body/create-competition-registration.dto';
import { AddJuryPresidentDto } from '../../src/competition/dto/in/body/add-jury-president.dto';
import { AddJudgeDto } from '../../src/competition/dto/in/body/add-judge.dto';
import { AddChiefRouteSetterDto } from '../../src/competition/dto/in/body/add-chief-route-setter.dto';
import { AddRouteSetterDto } from '../../src/competition/dto/in/body/add-route-setter.dto';
import { AddTechnicalDelegateDto } from '../../src/competition/dto/in/body/add-technical-delegate.dto';
import { CompetitionRegistrationDto } from '../../src/competition/dto/out/competition-registration.dto';
import supertest from 'supertest';
import { MikroORM } from 'mikro-orm';
import MikroORMConfig from '../../src/mikro-orm.config';
import { User } from '../../src/user/user.entity';
import { SystemRole } from '../../src/user/user-role.enum';

import {
  CategoryName,
  CompetitionType,
  Sex,
} from '../../src/competition/competition.entity';
import { AddOrganizerDto } from '../../src/competition/dto/in/body/add-organizer.dto';

// FIXME : use services or entity repository directly to increase speed test

export default class TestUtils {
  private orm?: MikroORM;

  constructor(private readonly api: supertest.SuperTest<supertest.Test>) {}

  async getORM(): Promise<MikroORM> {
    if (this.orm) {
      return this.orm;
    }

    this.orm = await MikroORM.init(MikroORMConfig);
    await this.orm.connect();
    return this.orm;
  }

  givenUser(): Promise<CredentialsDto & UserDto> {
    return new Promise((resolve, reject) => {
      const registerDto: RegisterDto = {
        email: `${uuid.v4()}@${uuid.v4()}.fr`,
        password: uuid.v4().substr(0, 10),
      };

      return this.api
        .post('/api/users')
        .send(registerDto)
        .expect(201)
        .then((res) => {
          resolve({
            ...res.body,
            ...registerDto,
          });
        })
        .catch(reject);
    });
  }

  async givenAdminUser(): Promise<CredentialsDto & UserDto> {
    const registerDto: RegisterDto = {
      email: `${uuid.v4()}@${uuid.v4()}.fr`,
      password: uuid.v4().substr(0, 10),
    };

    const { body } = await this.api
      .post('/api/users')
      .send(registerDto)
      .expect(201);

    const user: CredentialsDto & UserDto = {
      ...body,
      ...registerDto,
    };

    const orm = await this.getORM();
    const userEntity = await orm.em.findOneOrFail(User, body.id);
    userEntity.systemRole = SystemRole.Admin;
    await orm.em.persistAndFlush(userEntity);

    return user;
  }

  givenCompetitionData(): CreateCompetitionDTO {
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
      address: uuid.v4(),
      categories: [
        {
          sex: Sex.Male,
          name: CategoryName.Minime,
        },
      ],
      city: uuid.v4(),
      name: uuid.v4(),
      postalCode: uuid.v4(),
      type: CompetitionType.Lead,
      startDate: today,
      endDate: tomorrow,
    };
  }

  async givenCompetition(
    tokenResponse: TokenResponseDto,
  ): Promise<CompetitionDto> {
    const competition = this.givenCompetitionData();

    const res = await this.api
      .post('/api/competitions')
      .set('Authorization', `Bearer ${tokenResponse.token}`)
      .send(competition)
      .expect(201);

    return res.body;
  }

  login(user: CredentialsDto): Promise<TokenResponseDto> {
    return new Promise((resolve, reject) => {
      this.api
        .post('/api/users/token')
        .send({
          email: user.email,
          password: user.password,
        })
        .expect(201)
        .then((res) => {
          resolve(res.body);
        })
        .catch(reject);
    });
  }

  async registerUserInCompetition(
    user: UserDto,
    token: TokenResponseDto,
    competition: CompetitionDto,
  ): Promise<void> {
    const dto: CreateCompetitionRegistrationDto = {
      userId: user.id,
    };

    await this.api
      .post(`/api/competitions/${competition.id}/registrations`)
      .set('Authorization', `Bearer ${token.token}`)
      .send(dto)
      .expect(204);
  }

  async getRegistrations(
    competition: CompetitionDto,
  ): Promise<CompetitionRegistrationDto[]> {
    const res = await this.api
      .get(`/api/competitions/${competition.id}/registrations`)
      .expect(200);

    return res.body;
  }

  async addJuryPresidentInCompetition(
    user: UserDto,
    token: TokenResponseDto,
    competition: CompetitionDto,
  ): Promise<void> {
    const dto: AddJuryPresidentDto = {
      userId: user.id,
    };

    await this.api
      .post(`/api/competitions/${competition.id}/jury-presidents`)
      .set('Authorization', `Bearer ${token.token}`)
      .send(dto)
      .expect(204);
  }

  async getJuryPresidents(competition: CompetitionDto): Promise<UserDto[]> {
    const res = await this.api
      .get(`/api/competitions/${competition.id}/jury-presidents`)
      .expect(200);

    return res.body;
  }

  async addJudgeInCompetition(
    user: UserDto,
    token: TokenResponseDto,
    competition: CompetitionDto,
  ): Promise<void> {
    const dto: AddJudgeDto = {
      userId: user.id,
    };

    await this.api
      .post(`/api/competitions/${competition.id}/judges`)
      .set('Authorization', `Bearer ${token.token}`)
      .send(dto)
      .expect(204);
  }

  async getJudges(competition: CompetitionDto): Promise<UserDto[]> {
    const res = await this.api
      .get(`/api/competitions/${competition.id}/judges`)
      .expect(200);

    return res.body;
  }

  async addChiefRouteSetterInCompetition(
    user: UserDto,
    token: TokenResponseDto,
    competition: CompetitionDto,
  ): Promise<void> {
    const dto: AddChiefRouteSetterDto = {
      userId: user.id,
    };

    await this.api
      .post(`/api/competitions/${competition.id}/chief-route-setters`)
      .set('Authorization', `Bearer ${token.token}`)
      .send(dto)
      .expect(204);
  }

  async getChiefRouteSetters(competition: CompetitionDto): Promise<UserDto[]> {
    const res = await this.api
      .get(`/api/competitions/${competition.id}/chief-route-setters`)
      .expect(200);

    return res.body;
  }

  async addRouteSetterInCompetition(
    user: UserDto,
    token: TokenResponseDto,
    competition: CompetitionDto,
  ): Promise<void> {
    const dto: AddRouteSetterDto = {
      userId: user.id,
    };

    await this.api
      .post(`/api/competitions/${competition.id}/route-setters`)
      .set('Authorization', `Bearer ${token.token}`)
      .send(dto)
      .expect(204);
  }

  async getRouteSetters(competition: CompetitionDto): Promise<UserDto[]> {
    const res = await this.api
      .get(`/api/competitions/${competition.id}/route-setters`)
      .expect(200);

    return res.body;
  }

  async addTechnicalDelegateInCompetition(
    user: UserDto,
    token: TokenResponseDto,
    competition: CompetitionDto,
  ): Promise<void> {
    const dto: AddTechnicalDelegateDto = {
      userId: user.id,
    };

    await this.api
      .post(`/api/competitions/${competition.id}/technical-delegates`)
      .set('Authorization', `Bearer ${token.token}`)
      .send(dto)
      .expect(204);
  }

  async getTechnicalDelegates(competition: CompetitionDto): Promise<UserDto[]> {
    const res = await this.api
      .get(`/api/competitions/${competition.id}/technical-delegates`)
      .expect(200);

    return res.body;
  }

  async addOrganizerInCompetition(
    user: UserDto,
    token: TokenResponseDto,
    competition: CompetitionDto,
  ): Promise<void> {
    const dto: AddOrganizerDto = {
      userId: user.id,
    };

    await this.api
      .post(`/api/competitions/${competition.id}/organizers`)
      .set('Authorization', `Bearer ${token.token}`)
      .send(dto)
      .expect(204);
  }

  async getOrganizers(competition: CompetitionDto): Promise<UserDto[]> {
    const res = await this.api
      .get(`/api/competitions/${competition.id}/organizers`)
      .expect(200);

    return res.body;
  }
}
