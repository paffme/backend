import supertest from 'supertest';
import * as uuid from 'uuid';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { INestApplication } from '@nestjs/common';
import { RegisterDto } from '../../src/user/dto/in/body/register.dto';
import { UserDto } from '../../src/user/dto/out/user.dto';
import { configure } from '../../src/app.configuration';
import TestUtils from './utils';
import { UserService } from '../../src/user/user.service';
import { ConfigurationService } from '../../src/shared/configuration/configuration.service';

describe('User (e2e)', () => {
  let app: INestApplication;
  let userService: UserService;
  let configService: ConfigurationService;
  let utils: TestUtils;
  let api;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    configure(app);
    await app.init();
    userService = moduleFixture.get<UserService>(UserService);
    configService = moduleFixture.get<ConfigurationService>(
      ConfigurationService,
    );
    api = supertest(app.getHttpServer());
    utils = new TestUtils(api);
  });

  afterAll(async () => {
    await app.close();
  });

  function checkUser(expectedUser, user: UserDto): void {
    expect(user.email).toEqual(expectedUser.email);
    expect((user as any).password).toBeUndefined();
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('createdAt');
    expect(user).toHaveProperty('updatedAt');
  }

  it('/users (POST)', () => {
    const user: RegisterDto = {
      email: `${uuid.v4()}@${uuid.v4()}.fr`,
      password: uuid.v4().substr(0, 10),
    };

    return api
      .post('/api/users')
      .send(user)
      .expect(201)
      .then((res) => {
        checkUser(user, res.body);
      });
  });

  it('/users (POST) with validation', () => {
    const user = {
      email: uuid.v4(),
      password: 444,
    };

    return api
      .post('/api/users')
      .send(user)
      .expect(422)
      .then((res) => {
        expect(res.body.statusCode).toEqual(422);
        expect(res.body.error).toEqual('Validation Error');
        expect(res.body.message).toEqual('Validation Error');
        expect(Array.isArray(res.body.errors)).toBeTruthy();
        expect(res.body.errors[0].property).toEqual('email');
        expect(res.body.errors[0].constraints.isEmail).toBeTruthy();
        expect(res.body.errors[1].property).toEqual('password');
        expect(res.body.errors[1].constraints.length).toBeTruthy();
      });
  });

  it('/users/{userId} (DELETE)', async () => {
    const user = await utils.givenUser();
    const auth = await utils.login(user);

    await api
      .delete('/api/users/' + user.id)
      .set('Authorization', 'Bearer ' + auth.token)
      .expect(204);
  });

  it('/users/{userId} (GET)', async () => {
    const user = await utils.givenUser();
    const auth = await utils.login(user);

    await api
      .get('/api/users/' + auth.userId)
      .set('Authorization', 'Bearer ' + auth.token)
      .expect(200)
      .then((res) => {
        checkUser(user, res.body);
      });
  });

  it('/users/{userId} (GET) returns 404 when not found', async () => {
    const user = await utils.givenUser();
    const auth = await utils.login(user);

    await api
      .get('/api/users/999999999')
      .set('Authorization', 'Bearer ' + auth.token)
      .expect(404);
  });

  it('/users/{userId} (PATCH)', async () => {
    const user = await utils.givenUser();
    const auth = await utils.login(user);

    await api
      .patch('/api/users/' + auth.userId)
      .set('Authorization', 'Bearer ' + auth.token)
      .send({
        email: 'new@email.fr',
      })
      .expect(200)
      .then((res) => {
        checkUser(
          {
            ...user,
            email: 'new@email.fr',
          },
          res.body,
        );
      });
  });

  it('/users/token (POST)', async () => {
    const user = await utils.givenUser();

    await api
      .post('/api/users/token')
      .send({
        email: user.email,
        password: user.password,
      })
      .expect(201)
      .then((res) => {
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('userId');
        expect(res.body.userId).toEqual(user.id);
        expect(res.body).toHaveProperty('expiresIn');
        expect(res.body).toHaveProperty('createdAt');
      });
  });

  it('GET /users/{userId}/registrations', async function () {
    const user = await utils.givenUser();
    const token = await utils.login(user);
    const competition = await utils.givenCompetition(token);
    await utils.registerUserInCompetition(user, token, competition);

    const res = await api
      .get(`/api/users/${user.id}/registrations`)
      .expect(200);

    const registration = res.body.find(
      (r) => r.userId === user.id && r.competitionId === competition.id,
    );

    expect(registration).toBeTruthy();
    expect(registration).toHaveProperty('createdAt');
    expect(registration).toHaveProperty('updatedAt');
  });

  it('GET /users/{userId}/jury-presidencies', async function () {
    const user = await utils.givenUser();
    const token = await utils.login(user);
    const competition = await utils.givenCompetition(token);
    await utils.addJuryPresidentInCompetition(user, token, competition);

    const res = await api
      .get(`/api/users/${user.id}/jury-presidencies`)
      .expect(200);

    const juryPresidency = res.body.find((r) => r.id === competition.id);
    expect(juryPresidency).toBeTruthy();
  });

  it('GET /users/{userId}/judgements', async function () {
    const user = await utils.givenUser();
    const token = await utils.login(user);
    const competition = await utils.givenCompetition(token);
    await utils.addJudgeInCompetition(user, token, competition);

    const res = await api.get(`/api/users/${user.id}/judgements`).expect(200);

    const judgement = res.body.find((r) => r.id === competition.id);
    expect(judgement).toBeTruthy();
  });

  it('GET /users/{userId}/chief-route-settings', async function () {
    const user = await utils.givenUser();
    const token = await utils.login(user);
    const competition = await utils.givenCompetition(token);
    await utils.addChiefRouteSetterInCompetition(user, token, competition);

    const res = await api
      .get(`/api/users/${user.id}/chief-route-settings`)
      .expect(200);

    const chiefRouteSetting = res.body.find((r) => r.id === competition.id);
    expect(chiefRouteSetting).toBeTruthy();
  });

  it('GET /users/{userId}/route-settings', async function () {
    const user = await utils.givenUser();
    const token = await utils.login(user);
    const competition = await utils.givenCompetition(token);
    await utils.addRouteSetterInCompetition(user, token, competition);

    const res = await api
      .get(`/api/users/${user.id}/route-settings`)
      .expect(200);

    const routeSetting = res.body.find((r) => r.id === competition.id);
    expect(routeSetting).toBeTruthy();
  });

  it('GET /users/{userId}/technical-delegations', async function () {
    const user = await utils.givenUser();
    const token = await utils.login(user);
    const competition = await utils.givenCompetition(token);
    await utils.addTechnicalDelegateInCompetition(user, token, competition);

    const res = await api
      .get(`/api/users/${user.id}/technical-delegations`)
      .expect(200);

    const technicalDelegation = res.body.find((r) => r.id === competition.id);
    expect(technicalDelegation).toBeTruthy();
  });
});
