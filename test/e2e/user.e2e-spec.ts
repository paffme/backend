import supertest from 'supertest';
import * as uuid from 'uuid';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { RegisterDto } from '../../src/user/dto/in/body/register.dto';
import { UserDto } from '../../src/user/dto/out/user.dto';
import { configure } from '../../src/app.configuration';
import TestUtils from './utils';
import { UserService } from '../../src/user/user.service';
import { ConfigurationService } from '../../src/shared/configuration/configuration.service';
import { CompetitionDto } from '../../src/competition/dto/out/competition.dto';
import { CompetitionRegistrationDto } from '../../src/competition/dto/out/competition-registration.dto';
import { NestExpressApplication } from '@nestjs/platform-express';

describe('User (e2e)', () => {
  let app: NestExpressApplication;
  let userService: UserService;
  let configService: ConfigurationService;
  let utils: TestUtils;
  let api: supertest.SuperTest<supertest.Test>;

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

  function checkUser(expectedUser: any, user: UserDto): void {
    expect(user.email).toEqual(expectedUser.email);
    expect((user as any).password).toBeUndefined();
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('createdAt');
    expect(user).toHaveProperty('updatedAt');
  }

  describe('POST /users', () => {
    it('creates a user', () => {
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

    it('validates user creation', () => {
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

    it('does not allow authenticated user to create a user', async () => {
      const user = await utils.givenUser();
      const auth = await utils.login(user);

      const secondUser: RegisterDto = {
        email: `${uuid.v4()}@${uuid.v4()}.fr`,
        password: uuid.v4().substr(0, 10),
      };

      await api
        .post('/api/users')
        .set('Authorization', 'Bearer ' + auth.token)
        .send(secondUser)
        .expect(403);
    });
  });

  describe('POST /users/token', () => {
    it('creates a JWT', async () => {
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

    it('creates a JWT for an already authenticated user', async () => {
      const user = await utils.givenUser();
      const auth = await utils.login(user);

      await api
        .post('/api/users/token')
        .set('Authorization', 'Bearer ' + auth.token)
        .send({
          email: user.email,
          password: user.password,
        })
        .expect(201)
        .then((res) => {
          expect(res.body.userId).toEqual(user.id);
        });
    });
  });

  describe('GET /users/{userId}', () => {
    it('gets a user by ID', async () => {
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

    it('returns 401 when unauthenticated user do not own the accessed user', async () => {
      await api.get('/api/users/999999').expect(401);
    });

    it('returns 403 when authenticated user do not own the accessed user', async () => {
      const user = await utils.givenUser();
      const auth = await utils.login(user);

      await api
        .get('/api/users/999999999')
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(403);
    });

    it('returns 404 when getting an unknown user', async () => {
      const user = await utils.givenAdminUser();
      const auth = await utils.login(user);

      await api
        .get('/api/users/999999999')
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(404);
    });

    it('allows admin to access any user', async () => {
      const user = await utils.givenUser();
      const admin = await utils.givenAdminUser();
      const auth = await utils.login(admin);

      await api
        .get('/api/users/' + user.id)
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(200)
        .then((res) => {
          checkUser(user, res.body);
        });
    });
  });

  describe('DELETE /users/{userId}', () => {
    it('deletes a user', async () => {
      const user = await utils.givenUser();
      const auth = await utils.login(user);

      await api
        .delete('/api/users/' + user.id)
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(204);
    });

    it('returns 401 when unauthenticated user do not own the accessed user', async () => {
      await api.delete('/api/users/999999').expect(401);
    });

    it('returns 403 when authenticated user do not own the accessed user', async () => {
      const user = await utils.givenUser();
      const auth = await utils.login(user);

      await api
        .delete('/api/users/999999999')
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(403);
    });

    it('returns 404 when deleting an unknown user', async () => {
      const user = await utils.givenAdminUser();
      const auth = await utils.login(user);

      await api
        .delete('/api/users/999999999')
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(404);
    });

    it('allows admin to delete any user', async () => {
      const user = await utils.givenUser();
      const admin = await utils.givenAdminUser();
      const auth = await utils.login(admin);

      await api
        .delete('/api/users/' + user.id)
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(204);
    });
  });

  describe('PATCH /users/{userId}', () => {
    it('updates a user by ID', async () => {
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

    it('returns 401 when unauthenticated user do not own the accessed user', async () => {
      await api.patch('/api/users/999999').expect(401);
    });

    it('returns 403 when authenticated user do not own the accessed user', async () => {
      const user = await utils.givenUser();
      const auth = await utils.login(user);

      await api
        .patch('/api/users/999999999')
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(403);
    });

    it('returns 404 when updating an unknown user', async () => {
      const user = await utils.givenAdminUser();
      const auth = await utils.login(user);

      await api
        .patch('/api/users/999999999')
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(404);
    });

    it('allows admin to update any user', async () => {
      const user = await utils.givenUser();
      const admin = await utils.givenAdminUser();
      const auth = await utils.login(admin);

      await api
        .patch('/api/users/' + user.id)
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
  });

  describe('GET /users/{userId}/registrations', () => {
    it('gets user registrations', async function () {
      const user = await utils.givenUser();
      const auth = await utils.login(user);
      const competition = await utils.givenCompetition(auth);
      await utils.registerUserInCompetition(user, auth, competition);

      const res = await api
        .get(`/api/users/${user.id}/registrations`)
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(200);

      const registration = res.body.find(
        (r: CompetitionRegistrationDto): boolean =>
          r.userId === user.id && r.competitionId === competition.id,
      );

      expect(registration).toBeTruthy();
      expect(registration).toHaveProperty('createdAt');
      expect(registration).toHaveProperty('updatedAt');
    });

    it('returns 401 when unauthenticated user do not own the accessed user', async () => {
      await api.get('/api/users/999999/registrations').expect(401);
    });

    it('returns 403 when authenticated user do not own the accessed user', async () => {
      const user = await utils.givenUser();
      const auth = await utils.login(user);

      await api
        .get('/api/users/999999/registrations')
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(403);
    });

    it('returns 404 when getting an unknown user', async () => {
      const user = await utils.givenAdminUser();
      const auth = await utils.login(user);

      await api
        .get('/api/users/999999/registrations')
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(404);
    });

    it('allows admin to access any user registrations', async () => {
      const user = await utils.givenUser();
      const userAuth = await utils.login(user);
      const competition = await utils.givenCompetition(userAuth);
      await utils.registerUserInCompetition(user, userAuth, competition);

      const admin = await utils.givenAdminUser();
      const adminAuth = await utils.login(admin);

      const res = await api
        .get(`/api/users/${user.id}/registrations`)
        .set('Authorization', 'Bearer ' + adminAuth.token)
        .expect(200);

      const registration = res.body.find(
        (r: CompetitionRegistrationDto): boolean =>
          r.userId === user.id && r.competitionId === competition.id,
      );

      expect(registration).toBeTruthy();
    });
  });

  describe('GET /users/{userId}/jury-presidencies', () => {
    it('gets user jury presidencies', async function () {
      const user = await utils.givenUser();
      const auth = await utils.login(user);
      const competition = await utils.givenCompetition(auth);
      await utils.addJuryPresidentInCompetition(user, auth, competition);

      const res = await api
        .get(`/api/users/${user.id}/jury-presidencies`)
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(200);

      const juryPresidency = res.body.find(
        (r: CompetitionDto): boolean => r.id === competition.id,
      );

      expect(juryPresidency).toBeTruthy();
    });

    it('returns 401 when unauthenticated user do not own the accessed user', async () => {
      await api.get('/api/users/999999/jury-presidencies').expect(401);
    });

    it('returns 403 when authenticated user do not own the accessed user', async () => {
      const user = await utils.givenUser();
      const auth = await utils.login(user);

      await api
        .get('/api/users/999999/jury-presidencies')
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(403);
    });

    it('returns 404 when getting an unknown user', async () => {
      const user = await utils.givenAdminUser();
      const auth = await utils.login(user);

      await api
        .get('/api/users/999999/jury-presidencies')
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(404);
    });

    it('allows admin to access any user jury presidencies', async () => {
      const user = await utils.givenUser();
      const userAuth = await utils.login(user);
      const competition = await utils.givenCompetition(userAuth);
      await utils.addJuryPresidentInCompetition(user, userAuth, competition);

      const admin = await utils.givenAdminUser();
      const adminAuth = await utils.login(admin);

      const res = await api
        .get(`/api/users/${user.id}/jury-presidencies`)
        .set('Authorization', 'Bearer ' + adminAuth.token)
        .expect(200);

      const juryPresidency = res.body.find(
        (r: CompetitionDto): boolean => r.id === competition.id,
      );

      expect(juryPresidency).toBeTruthy();
    });
  });

  describe('GET /users/{userId}/judgements', () => {
    it('gets user judgements', async function () {
      const user = await utils.givenUser();
      const auth = await utils.login(user);
      const competition = await utils.givenCompetition(auth);
      await utils.addJudgeInCompetition(user, auth, competition);

      const res = await api
        .get(`/api/users/${user.id}/judgements`)
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(200);

      const judgement = res.body.find(
        (r: CompetitionDto): boolean => r.id === competition.id,
      );

      expect(judgement).toBeTruthy();
    });

    it('returns 401 when unauthenticated user do not own the accessed user', async () => {
      await api.get('/api/users/999999/judgements').expect(401);
    });

    it('returns 403 when authenticated user do not own the accessed user', async () => {
      const user = await utils.givenUser();
      const auth = await utils.login(user);

      await api
        .get('/api/users/999999/judgements')
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(403);
    });

    it('returns 404 when getting an unknown user', async () => {
      const user = await utils.givenAdminUser();
      const auth = await utils.login(user);

      await api
        .get('/api/users/999999/judgements')
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(404);
    });

    it('allows admin to access any user judgements', async () => {
      const user = await utils.givenUser();
      const userAuth = await utils.login(user);
      const competition = await utils.givenCompetition(userAuth);
      await utils.addJudgeInCompetition(user, userAuth, competition);

      const admin = await utils.givenAdminUser();
      const adminAuth = await utils.login(admin);

      const res = await api
        .get(`/api/users/${user.id}/judgements`)
        .set('Authorization', 'Bearer ' + adminAuth.token)
        .expect(200);

      const judgement = res.body.find(
        (r: CompetitionDto): boolean => r.id === competition.id,
      );

      expect(judgement).toBeTruthy();
    });
  });

  describe('GET /users/{userId}/chief-route-settings', () => {
    it('gets user chief route settings', async function () {
      const user = await utils.givenUser();
      const auth = await utils.login(user);
      const competition = await utils.givenCompetition(auth);
      await utils.addChiefRouteSetterInCompetition(user, auth, competition);

      const res = await api
        .get(`/api/users/${user.id}/chief-route-settings`)
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(200);

      const chiefRouteSetting = res.body.find(
        (r: CompetitionDto): boolean => r.id === competition.id,
      );

      expect(chiefRouteSetting).toBeTruthy();
    });

    it('returns 401 when unauthenticated user do not own the accessed user', async () => {
      await api.get('/api/users/999999/chief-route-settings').expect(401);
    });

    it('returns 403 when authenticated user do not own the accessed user', async () => {
      const user = await utils.givenUser();
      const auth = await utils.login(user);

      await api
        .get('/api/users/999999/chief-route-settings')
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(403);
    });

    it('returns 404 when getting an unknown user', async () => {
      const user = await utils.givenAdminUser();
      const auth = await utils.login(user);

      await api
        .get('/api/users/999999/chief-route-settings')
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(404);
    });

    it('allows admin to access any user chief route settings', async () => {
      const user = await utils.givenUser();
      const userAuth = await utils.login(user);
      const competition = await utils.givenCompetition(userAuth);
      await utils.addChiefRouteSetterInCompetition(user, userAuth, competition);

      const admin = await utils.givenAdminUser();
      const adminAuth = await utils.login(admin);

      const res = await api
        .get(`/api/users/${user.id}/chief-route-settings`)
        .set('Authorization', 'Bearer ' + adminAuth.token)
        .expect(200);

      const chiefRouteSetting = res.body.find(
        (r: CompetitionDto): boolean => r.id === competition.id,
      );

      expect(chiefRouteSetting).toBeTruthy();
    });
  });

  describe('GET /users/{userId}/route-settings', () => {
    it('gets user route settings', async function () {
      const user = await utils.givenUser();
      const auth = await utils.login(user);
      const competition = await utils.givenCompetition(auth);
      await utils.addRouteSetterInCompetition(user, auth, competition);

      const res = await api
        .get(`/api/users/${user.id}/route-settings`)
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(200);

      const routeSetting = res.body.find(
        (r: CompetitionDto): boolean => r.id === competition.id,
      );

      expect(routeSetting).toBeTruthy();
    });

    it('returns 401 when unauthenticated user do not own the accessed user', async () => {
      await api.get('/api/users/999999/route-settings').expect(401);
    });

    it('returns 403 when authenticated user do not own the accessed user', async () => {
      const user = await utils.givenUser();
      const auth = await utils.login(user);

      await api
        .get('/api/users/999999/route-settings')
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(403);
    });

    it('returns 404 when getting an unknown user', async () => {
      const user = await utils.givenAdminUser();
      const auth = await utils.login(user);

      await api
        .get('/api/users/999999/route-settings')
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(404);
    });

    it('allows admin to access any user route settings', async () => {
      const user = await utils.givenUser();
      const userAuth = await utils.login(user);
      const competition = await utils.givenCompetition(userAuth);
      await utils.addRouteSetterInCompetition(user, userAuth, competition);

      const admin = await utils.givenAdminUser();
      const adminAuth = await utils.login(admin);

      const res = await api
        .get(`/api/users/${user.id}/route-settings`)
        .set('Authorization', 'Bearer ' + adminAuth.token)
        .expect(200);

      const routeSetting = res.body.find(
        (r: CompetitionDto): boolean => r.id === competition.id,
      );

      expect(routeSetting).toBeTruthy();
    });
  });

  describe('GET /users/{userId}/technical-delegations', () => {
    it('gets user technical delegations', async function () {
      const user = await utils.givenUser();
      const auth = await utils.login(user);
      const competition = await utils.givenCompetition(auth);
      await utils.addTechnicalDelegateInCompetition(user, auth, competition);

      const res = await api
        .get(`/api/users/${user.id}/technical-delegations`)
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(200);

      const technicalDelegation = res.body.find(
        (r: CompetitionDto): boolean => r.id === competition.id,
      );

      expect(technicalDelegation).toBeTruthy();
    });

    it('returns 401 when unauthenticated user do not own the accessed user', async () => {
      await api.get('/api/users/999999/technical-delegations').expect(401);
    });

    it('returns 403 when authenticated user do not own the accessed user', async () => {
      const user = await utils.givenUser();
      const auth = await utils.login(user);

      await api
        .get('/api/users/999999/technical-delegations')
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(403);
    });

    it('returns 404 when getting an unknown user', async () => {
      const user = await utils.givenAdminUser();
      const auth = await utils.login(user);

      await api
        .get('/api/users/999999/technical-delegations')
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(404);
    });

    it('allows admin to access any user technical delegations', async () => {
      const user = await utils.givenUser();
      const auth = await utils.login(user);
      const competition = await utils.givenCompetition(auth);
      await utils.addTechnicalDelegateInCompetition(user, auth, competition);

      const admin = await utils.givenAdminUser();
      const adminAuth = await utils.login(admin);

      const res = await api
        .get(`/api/users/${user.id}/technical-delegations`)
        .set('Authorization', 'Bearer ' + adminAuth.token)
        .expect(200);

      const technicalDelegation = res.body.find(
        (r: CompetitionDto): boolean => r.id === competition.id,
      );

      expect(technicalDelegation).toBeTruthy();
    });
  });

  describe('GET /users/{userId}/organizations', () => {
    it('gets user organizations', async function () {
      const user = await utils.givenUser();
      const auth = await utils.login(user);
      const competition = await utils.givenCompetition(auth);

      const res = await api
        .get(`/api/users/${user.id}/organizations`)
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(200);

      const organization = res.body.find(
        (r: CompetitionDto): boolean => r.id === competition.id,
      );

      expect(organization).toBeTruthy();
    });

    it('returns 401 when unauthenticated user do not own the accessed user', async () => {
      await api.get('/api/users/999999/organizations').expect(401);
    });

    it('returns 403 when authenticated user do not own the accessed user', async () => {
      const user = await utils.givenUser();
      const auth = await utils.login(user);

      await api
        .get('/api/users/999999/organizations')
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(403);
    });

    it('returns 404 when getting an unknown user', async () => {
      const user = await utils.givenAdminUser();
      const auth = await utils.login(user);

      await api
        .get('/api/users/999999/organizations')
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(404);
    });

    it('allows admin to access any user organizations', async () => {
      const user = await utils.givenUser();
      const auth = await utils.login(user);
      const competition = await utils.givenCompetition(auth);

      const admin = await utils.givenAdminUser();
      const adminAuth = await utils.login(admin);

      const res = await api
        .get(`/api/users/${user.id}/organizations`)
        .set('Authorization', 'Bearer ' + adminAuth.token)
        .expect(200);

      const organization = res.body.find(
        (r: CompetitionDto): boolean => r.id === competition.id,
      );

      expect(organization).toBeTruthy();
    });
  });
});
