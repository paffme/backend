import supertest from 'supertest';
import * as uuid from 'uuid';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { RegisterDto } from '../../src/user/dto/in/body/register.dto';
import { UserDto } from '../../src/user/dto/out/user.dto';
import { configure } from '../../src/app.configuration';
import TestUtils from '../utils';
import { UserService } from '../../src/user/user.service';
import { CompetitionDto } from '../../src/competition/dto/out/competition.dto';
import { CompetitionRegistrationDto } from '../../src/competition/dto/out/competition-registration.dto';
import { NestExpressApplication } from '@nestjs/platform-express';
import { CompetitionService } from '../../src/competition/competition.service';
import { Sex } from '../../src/shared/types/sex.enum';
import { BoulderService } from '../../src/bouldering/boulder/boulder.service';
import { CompetitionType } from '../../src/competition/types/competition-type.enum';
import { BoulderingGroupState } from '../../src/bouldering/group/bouldering-group.entity';

/* eslint-disable sonarjs/no-duplicate-string */

describe('User (e2e)', () => {
  let app: NestExpressApplication;
  let utils: TestUtils;
  let api: supertest.SuperTest<supertest.Test>;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    configure(app);
    await app.init();
    api = supertest(app.getHttpServer());

    utils = new TestUtils(
      moduleFixture.get(UserService),
      moduleFixture.get(CompetitionService),
      moduleFixture.get(BoulderService),
      moduleFixture.get('MikroORM'),
    );
  });

  beforeEach(() => {
    utils.clearORM();
  });

  afterAll(async () => {
    await app.close();
  });

  function checkUser(expectedUser: RegisterDto, user: UserDto): void {
    expect(user.email).toEqual(expectedUser.email);
    expect(user.sex).toEqual(expectedUser.sex);
    expect(user.birthYear).toEqual(expectedUser.birthYear);
    expect(user.firstName).toEqual(expectedUser.firstName);
    expect(user.lastName).toEqual(expectedUser.lastName);
    expect(user.club).toEqual(expectedUser.club);
    expect((user as any).password).toBeUndefined();
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('createdAt');
    expect(user).toHaveProperty('updatedAt');
  }

  describe('GET /users', () => {
    it('gets user with filtering', async () => {
      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);
      const firstName = uuid.v4();

      const { user: user1 } = await utils.givenUser({
        firstName,
        lastName: 'World1',
      });

      const { user: user2 } = await utils.givenUser({
        firstName,
        lastName: 'World2',
      });

      const { body } = await api
        .get('/users')
        .query({
          q: JSON.stringify({
            firstName: {
              $eq: firstName,
            },
          }),
          sort: 'lastName',
          order: 'desc',
        })
        .set('Authorization', `Bearer ${auth.token}`)
        .expect(200);

      expect(body).toHaveLength(2);
      expect(body[0].id).toEqual(user2.id);
      expect(body[1].id).toEqual(user1.id);
    });

    it('returns 400 when getting user without filtering', async () => {
      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);

      await api
        .get('/users')
        .set('Authorization', `Bearer ${auth.token}`)
        .expect(400);
    });

    it('returns 401 when getting users without being authenticated', async () => {
      await api.get('/users').expect(401);
    });
  });

  describe('GET /users/count', () => {
    it('count users', async () => {
      await utils.givenUser();
      const { body } = await api.get('/users/count').expect(200);
      expect(body.count).toBeGreaterThanOrEqual(1);
    });
  });

  describe('POST /users', () => {
    it('creates a user', async () => {
      const user: RegisterDto = {
        firstName: uuid.v4().substr(0, 10),
        lastName: uuid.v4().substr(0, 10),
        email: `${uuid.v4()}@${uuid.v4()}.fr`,
        password: uuid.v4().substr(0, 10),
        sex: Sex.Female,
        birthYear: 2000,
        club: uuid.v4().substr(0, 10),
      };

      const { body } = await api.post('/users').send(user).expect(201);
      checkUser(user, body);
    });

    it('creates a user with lower cased email', async () => {
      const email = `${uuid.v4()}@${uuid.v4()}.fr`;

      const user: RegisterDto = {
        firstName: uuid.v4().substr(0, 10),
        lastName: uuid.v4().substr(0, 10),
        email: email.toUpperCase(),
        password: uuid.v4().substr(0, 10),
        sex: Sex.Female,
        birthYear: 2000,
        club: uuid.v4().substr(0, 10),
      };

      const { body } = await api.post('/users').send(user).expect(201);
      expect(body.email).toEqual(email);
    });

    it('does not creates a user if the mail is already used', async () => {
      const user: RegisterDto = {
        firstName: uuid.v4().substr(0, 10),
        lastName: uuid.v4().substr(0, 10),
        email: `${uuid.v4()}@${uuid.v4()}.fr`,
        password: uuid.v4().substr(0, 10),
        sex: Sex.Female,
        birthYear: 2000,
        club: uuid.v4().substr(0, 10),
      };

      const { body } = await api.post('/users').send(user).expect(201);
      checkUser(user, body);

      await api.post('/users').send(user).expect(409);
    });

    it('validates user creation', async () => {
      const user = {
        email: uuid.v4(),
        password: 444,
      };

      const { body } = await api.post('/users').send(user).expect(422);

      expect(body.statusCode).toEqual(422);
      expect(body.error).toEqual('Validation Error');
      expect(body.message).toEqual('Validation Error');
      expect(Array.isArray(body.errors)).toBeTruthy();
      expect(body.errors[0].property).toEqual('email');
      expect(body.errors[0].constraints.isEmail).toBeTruthy();
      expect(body.errors[1].property).toEqual('password');
      expect(body.errors[1].constraints.length).toBeTruthy();
      expect(body.errors[2].property).toEqual('firstName');
      expect(body.errors[2].constraints.length).toBeTruthy();
      expect(body.errors[2].constraints.isString).toBeTruthy();
      expect(body.errors[3].property).toEqual('lastName');
      expect(body.errors[3].constraints.length).toBeTruthy();
      expect(body.errors[3].constraints.isString).toBeTruthy();
    });

    it('returns 403 for authenticated user trying to create a user', async () => {
      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);

      const secondUser: RegisterDto = {
        firstName: uuid.v4(),
        lastName: uuid.v4(),
        email: `${uuid.v4()}@${uuid.v4()}.fr`,
        password: uuid.v4().substr(0, 10),
        birthYear: 1500,
        sex: Sex.Female,
        club: uuid.v4(),
      };

      await api
        .post('/users')
        .set('Authorization', 'Bearer ' + auth.token)
        .send(secondUser)
        .expect(403);
    });
  });

  describe('POST /users/token', () => {
    it('creates a JWT', async () => {
      const { credentials, user } = await utils.givenUser();

      const { body } = await api
        .post('/users/token')
        .send({
          email: credentials.email,
          password: credentials.password,
        })
        .expect(201);

      expect(body).toHaveProperty('token');
      expect(body).toHaveProperty('userId');
      expect(body.userId).toEqual(user.id);
      expect(body).toHaveProperty('expiresIn');
      expect(body).toHaveProperty('createdAt');
    });

    it('creates a JWT for an already authenticated user', async () => {
      const { user, credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);

      const { body } = await api
        .post('/users/token')
        .set('Authorization', 'Bearer ' + auth.token)
        .send({
          email: credentials.email,
          password: credentials.password,
        })
        .expect(201);

      expect(body.userId).toEqual(user.id);
    });
  });

  describe('GET /users/{userId}', () => {
    it('gets a user by ID', async () => {
      const { user, credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);

      const { body } = await api
        .get('/users/' + auth.userId)
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(200);

      checkUser(user, body);
    });

    it('returns 401 when unauthenticated user do not own the accessed user', async () => {
      await api.get('/users/999999').expect(401);
    });

    it('returns 403 when authenticated user do not own the accessed user', async () => {
      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);

      await api
        .get('/users/999999999')
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(403);
    });

    it('allows admin to access any user', async () => {
      const { user } = await utils.givenUser();
      const { credentials } = await utils.givenAdminUser();
      const auth = await utils.login(credentials);

      const { body } = await api
        .get('/users/' + user.id)
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(200);

      checkUser(user, body);
    });
  });

  describe('DELETE /users/{userId}', () => {
    it('deletes a user', async () => {
      const { user, credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);

      await api
        .delete('/users/' + user.id)
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(204);
    });

    it('returns 401 when unauthenticated user do not own the accessed user', async () => {
      await api.delete('/users/999999').expect(401);
    });

    it('returns 403 when authenticated user do not own the accessed user', async () => {
      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);

      await api
        .delete('/users/999999999')
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(403);
    });

    it('allows admin to delete any user', async () => {
      const { user } = await utils.givenUser();
      const { credentials } = await utils.givenAdminUser();
      const auth = await utils.login(credentials);

      await api
        .delete('/users/' + user.id)
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(204);
    });
  });

  describe('PATCH /users/{userId}', () => {
    it('updates a user by ID', async () => {
      const { user, credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);
      const newEmail = `${uuid.v4()}@${uuid.v4()}.fr`;
      const newFirstName = uuid.v4().substring(0, 10);
      const newLastName = uuid.v4().substring(0, 10);
      const newClub = uuid.v4().substring(0, 5);
      const newBirthYear = user.birthYear + 1;

      const { body } = await api
        .patch('/users/' + auth.userId)
        .set('Authorization', 'Bearer ' + auth.token)
        .send({
          email: newEmail,
          club: newClub,
          birthYear: newBirthYear,
          firstName: newFirstName,
          lastName: newLastName,
        })
        .expect(200);

      checkUser(
        {
          ...user,
          email: newEmail,
          club: newClub,
          birthYear: newBirthYear,
          firstName: newFirstName,
          lastName: newLastName,
        },
        body,
      );
    });

    it('updates a user with lower cased email', async () => {
      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);
      const newEmail = `${uuid.v4()}@${uuid.v4()}.fr`;

      const { body } = await api
        .patch('/users/' + auth.userId)
        .set('Authorization', 'Bearer ' + auth.token)
        .send({
          email: newEmail.toUpperCase(),
        })
        .expect(200);

      expect(body.email).toEqual(newEmail);
    });

    it('prevents updating a user with an already used email', async () => {
      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);
      const { user: otherUser } = await utils.givenUser();

      await api
        .patch('/users/' + auth.userId)
        .set('Authorization', 'Bearer ' + auth.token)
        .send({
          email: otherUser.email,
        })
        .expect(409);
    });

    it('returns 401 when unauthenticated user do not own the accessed user', async () => {
      await api.patch('/users/999999').expect(401);
    });

    it('returns 403 when authenticated user do not own the accessed user', async () => {
      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);

      await api
        .patch('/users/999999999')
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(403);
    });

    it('allows admin to update any user', async () => {
      const { user } = await utils.givenUser();
      const { credentials } = await utils.givenAdminUser();
      const auth = await utils.login(credentials);
      const newEmail = `${uuid.v4()}@${uuid.v4()}.fr`;

      const { body } = await api
        .patch('/users/' + user.id)
        .set('Authorization', 'Bearer ' + auth.token)
        .send({
          email: newEmail,
        })
        .expect(200);

      checkUser(
        {
          ...user,
          email: newEmail,
        },
        body,
      );
    });
  });

  describe('GET /users/{userId}/registrations', () => {
    it('gets user registrations', async function () {
      const { user, credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);
      const competition = await utils.givenCompetition(user);
      await utils.registerUserInCompetition(user, competition);

      const res = await api
        .get(`/users/${user.id}/registrations`)
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(200);

      const registration = res.body.find(
        (r: CompetitionRegistrationDto): boolean =>
          r.user.id === user.id && r.competitionId === competition.id,
      );

      expect(registration).toBeTruthy();
      expect(registration).toHaveProperty('createdAt');
      expect(registration).toHaveProperty('updatedAt');
    });

    it('returns 401 when unauthenticated user do not own the accessed user', async () => {
      await api.get('/users/999999/registrations').expect(401);
    });

    it('returns 403 when authenticated user do not own the accessed user', async () => {
      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);

      await api
        .get('/users/999999/registrations')
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(403);
    });

    it('allows admin to access any user registrations', async () => {
      const { credentials } = await utils.givenAdminUser();
      const adminAuth = await utils.login(credentials);
      const { user } = await utils.givenUser();
      const competition = await utils.givenCompetition(user);

      await utils.registerUserInCompetition(user, competition);

      const res = await api
        .get(`/users/${user.id}/registrations`)
        .set('Authorization', 'Bearer ' + adminAuth.token)
        .expect(200);

      const registration = res.body.find(
        (r: CompetitionRegistrationDto): boolean =>
          r.user.id === user.id && r.competitionId === competition.id,
      );

      expect(registration).toBeTruthy();
    });
  });

  describe('GET /users/{userId}/jury-presidencies', () => {
    it('gets user jury presidencies', async function () {
      const { user, credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);
      const competition = await utils.givenCompetition(user);
      await utils.addJuryPresidentInCompetition(user, competition);

      const res = await api
        .get(`/users/${user.id}/jury-presidencies`)
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(200);

      const juryPresidency = res.body.find(
        (r: CompetitionDto): boolean => r.id === competition.id,
      );

      expect(juryPresidency).toBeTruthy();
    });

    it('returns 401 when unauthenticated user do not own the accessed user', async () => {
      await api.get('/users/999999/jury-presidencies').expect(401);
    });

    it('returns 403 when authenticated user do not own the accessed user', async () => {
      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);

      await api
        .get('/users/999999/jury-presidencies')
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(403);
    });

    it('allows admin to access any user jury presidencies', async () => {
      const { credentials } = await utils.givenAdminUser();
      const adminAuth = await utils.login(credentials);
      const { user } = await utils.givenUser();
      const competition = await utils.givenCompetition(user);

      await utils.addJuryPresidentInCompetition(user, competition);

      const res = await api
        .get(`/users/${user.id}/jury-presidencies`)
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
      const { user, credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);
      const competition = await utils.givenCompetition(user);
      await utils.addJudgeInCompetition(user, competition);

      const res = await api
        .get(`/users/${user.id}/judgements`)
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(200);

      const judgement = res.body.find(
        (r: CompetitionDto): boolean => r.id === competition.id,
      );

      expect(judgement).toBeTruthy();
    });

    it('returns 401 when unauthenticated user do not own the accessed user', async () => {
      await api.get('/users/999999/judgements').expect(401);
    });

    it('returns 403 when authenticated user do not own the accessed user', async () => {
      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);

      await api
        .get('/users/999999/judgements')
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(403);
    });

    it('allows admin to access any user judgements', async () => {
      const { credentials } = await utils.givenAdminUser();
      const adminAuth = await utils.login(credentials);
      const { user } = await utils.givenUser();
      const competition = await utils.givenCompetition(user);

      await utils.addJudgeInCompetition(user, competition);

      const res = await api
        .get(`/users/${user.id}/judgements`)
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
      const { user, credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);
      const competition = await utils.givenCompetition(user);
      await utils.addChiefRouteSetterInCompetition(user, competition);

      const res = await api
        .get(`/users/${user.id}/chief-route-settings`)
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(200);

      const chiefRouteSetting = res.body.find(
        (r: CompetitionDto): boolean => r.id === competition.id,
      );

      expect(chiefRouteSetting).toBeTruthy();
    });

    it('returns 401 when unauthenticated user do not own the accessed user', async () => {
      await api.get('/users/999999/chief-route-settings').expect(401);
    });

    it('returns 403 when authenticated user do not own the accessed user', async () => {
      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);

      await api
        .get('/users/999999/chief-route-settings')
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(403);
    });

    it('allows admin to access any user chief route settings', async () => {
      const { credentials } = await utils.givenAdminUser();
      const adminAuth = await utils.login(credentials);
      const { user } = await utils.givenUser();
      const competition = await utils.givenCompetition(user);

      await utils.addChiefRouteSetterInCompetition(user, competition);

      const res = await api
        .get(`/users/${user.id}/chief-route-settings`)
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
      const { user, credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);
      const competition = await utils.givenCompetition(user);
      await utils.addRouteSetterInCompetition(user, competition);

      const res = await api
        .get(`/users/${user.id}/route-settings`)
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(200);

      const routeSetting = res.body.find(
        (r: CompetitionDto): boolean => r.id === competition.id,
      );

      expect(routeSetting).toBeTruthy();
    });

    it('returns 401 when unauthenticated user do not own the accessed user', async () => {
      await api.get('/users/999999/route-settings').expect(401);
    });

    it('returns 403 when authenticated user do not own the accessed user', async () => {
      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);

      await api
        .get('/users/999999/route-settings')
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(403);
    });

    it('allows admin to access any user route settings', async () => {
      const { credentials } = await utils.givenAdminUser();
      const adminAuth = await utils.login(credentials);
      const { user } = await utils.givenUser();
      const competition = await utils.givenCompetition(user);

      await utils.addRouteSetterInCompetition(user, competition);

      const res = await api
        .get(`/users/${user.id}/route-settings`)
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
      const { user, credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);
      const competition = await utils.givenCompetition(user);
      await utils.addTechnicalDelegateInCompetition(user, competition);

      const res = await api
        .get(`/users/${user.id}/technical-delegations`)
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(200);

      const technicalDelegation = res.body.find(
        (r: CompetitionDto): boolean => r.id === competition.id,
      );

      expect(technicalDelegation).toBeTruthy();
    });

    it('returns 401 when unauthenticated user do not own the accessed user', async () => {
      await api.get('/users/999999/technical-delegations').expect(401);
    });

    it('returns 403 when authenticated user do not own the accessed user', async () => {
      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);

      await api
        .get('/users/999999/technical-delegations')
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(403);
    });

    it('allows admin to access any user technical delegations', async () => {
      const { credentials } = await utils.givenAdminUser();
      const adminAuth = await utils.login(credentials);
      const { user } = await utils.givenUser();
      const competition = await utils.givenCompetition(user);

      await utils.addTechnicalDelegateInCompetition(user, competition);

      const res = await api
        .get(`/users/${user.id}/technical-delegations`)
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
      const { user, credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);
      const competition = await utils.givenCompetition(user);

      const res = await api
        .get(`/users/${user.id}/organizations`)
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(200);

      const organization = res.body.find(
        (r: CompetitionDto): boolean => r.id === competition.id,
      );

      expect(organization).toBeTruthy();
    });

    it('returns 401 when unauthenticated user do not own the accessed user', async () => {
      await api.get('/users/999999/organizations').expect(401);
    });

    it('returns 403 when authenticated user do not own the accessed user', async () => {
      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);

      await api
        .get('/users/999999/organizations')
        .set('Authorization', 'Bearer ' + auth.token)
        .expect(403);
    });

    it('allows admin to access any user organizations', async () => {
      const { user } = await utils.givenUser();
      const competition = await utils.givenCompetition(user);

      const { credentials } = await utils.givenAdminUser();
      const adminAuth = await utils.login(credentials);

      const res = await api
        .get(`/users/${user.id}/organizations`)
        .set('Authorization', 'Bearer ' + adminAuth.token)
        .expect(200);

      const organization = res.body.find(
        (r: CompetitionDto): boolean => r.id === competition.id,
      );

      expect(organization).toBeTruthy();
    });
  });

  describe('GET /users/{userId}/competitions-roles', () => {
    it('gets user competitions roles', async () => {
      const { user, credentials } = await utils.givenUser();
      const competition = await utils.givenCompetition(user);
      const auth = await utils.login(credentials);

      await utils.addJuryPresidentInCompetition(user, competition);
      await utils.addJudgeInCompetition(user, competition);
      await utils.addChiefRouteSetterInCompetition(user, competition);
      await utils.addRouteSetterInCompetition(user, competition);
      await utils.addTechnicalDelegateInCompetition(user, competition);

      const { body } = await api
        .get(`/users/${user.id}/competitions-roles`)
        .set('Authorization', `Bearer ${auth.token}`)
        .expect(200);

      expect(body).toHaveProperty('organizations');
      expect(body.organizations[0].id).toEqual(competition.id);

      expect(body).toHaveProperty('juryPresidencies');
      expect(body.juryPresidencies[0].id).toEqual(competition.id);

      expect(body).toHaveProperty('judgements');
      expect(body.judgements[0].id).toEqual(competition.id);

      expect(body).toHaveProperty('chiefRouteSettings');
      expect(body.chiefRouteSettings[0].id).toEqual(competition.id);

      expect(body).toHaveProperty('routeSettings');
      expect(body.routeSettings[0].id).toEqual(competition.id);

      expect(body).toHaveProperty('technicalDelegations');
      expect(body.technicalDelegations[0].id).toEqual(competition.id);
    });

    it('returns 401 when getting user competitions roles without authentication', async () => {
      const { user } = await utils.givenUser();
      await api.get(`/users/${user.id}/competitions-roles`).expect(401);
    });

    it('returns 403 when getting user competitions roles from another user', async () => {
      const { user } = await utils.givenUser();
      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);

      await api
        .get(`/users/${user.id}/competitions-roles`)
        .set('Authorization', `Bearer ${auth.token}`)
        .expect(403);
    });

    it('returns 403 when getting user competitions roles of an unknown user', async () => {
      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);

      await api
        .get('/users/9999999/competitions-roles')
        .set('Authorization', `Bearer ${auth.token}`)
        .expect(403);
    });
  });

  describe('GET /users/{userId}/competitions-roles/{competitionId}', () => {
    it('gets user competition roles (1)', async () => {
      const { user, credentials } = await utils.givenUser();
      const competition = await utils.givenCompetition(user);
      const auth = await utils.login(credentials);

      await utils.addJuryPresidentInCompetition(user, competition);
      await utils.addJudgeInCompetition(user, competition);
      await utils.addChiefRouteSetterInCompetition(user, competition);
      await utils.addRouteSetterInCompetition(user, competition);
      await utils.addTechnicalDelegateInCompetition(user, competition);

      const { body } = await api
        .get(`/users/${user.id}/competitions-roles/${competition.id}`)
        .set('Authorization', `Bearer ${auth.token}`)
        .expect(200);

      expect(body.organizer).toEqual(true);
      expect(body.juryPresident).toEqual(true);
      expect(body.judge).toEqual(true);
      expect(body.chiefRouteSetter).toEqual(true);
      expect(body.routeSetter).toEqual(true);
      expect(body.technicalDelegate).toEqual(true);
    });

    it('gets user competition roles (2)', async () => {
      const { user, credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);

      const { body } = await api
        .get(`/users/${user.id}/competitions-roles/9999999`)
        .set('Authorization', `Bearer ${auth.token}`)
        .expect(200);

      expect(body.organizer).toEqual(false);
      expect(body.juryPresident).toEqual(false);
      expect(body.judge).toEqual(false);
      expect(body.chiefRouteSetter).toEqual(false);
      expect(body.routeSetter).toEqual(false);
      expect(body.technicalDelegate).toEqual(false);
    });

    it('returns 401 when getting user competition roles without authentication', async () => {
      const { user } = await utils.givenUser();
      await api.get(`/users/${user.id}/competitions-roles/999999`).expect(401);
    });

    it('returns 403 when getting user competition roles from another user', async () => {
      const { user } = await utils.givenUser();
      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);

      await api
        .get(`/users/${user.id}/competitions-roles/999999`)
        .set('Authorization', `Bearer ${auth.token}`)
        .expect(403);
    });

    it('returns 403 when getting user competition roles of an unknown user', async () => {
      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);

      await api
        .get('/users/9999999/competitions-roles/999999')
        .set('Authorization', `Bearer ${auth.token}`)
        .expect(403);
    });
  });

  describe('GET /users/{userId}/judgements/assignments', () => {
    it('gets user judgement assignments', async () => {
      const { user, credentials } = await utils.givenUser();
      const competition = await utils.givenCompetition(user);
      const boulderingRound = await utils.addBoulderingRound(competition, {
        boulders: 1,
      });

      await utils.updateBoulderingGroupState(
        boulderingRound.groups.getItems()[0],
        BoulderingGroupState.ONGOING,
      );

      const boulder = boulderingRound.groups[0].boulders.getItems()[0];
      await utils.assignJudgeToBoulder(user, boulder);
      const auth = await utils.login(credentials);

      const { body } = await api
        .get(`/users/${user.id}/judgements/assignments`)
        .set('Authorization', `Bearer ${auth.token}`)
        .expect(200);

      expect(body).toHaveLength(1);
      expect(body[0].competitionId).toEqual(competition.id);
      expect(body[0].roundId).toEqual(boulderingRound.id);
      expect(body[0].groupId).toEqual(boulderingRound.groups[0].id);
      expect(body[0].type).toEqual(CompetitionType.Bouldering);
      expect(body[0].assignedElementId).toEqual(boulder.id);
    });

    it('returns 401 when getting assignments without auth', async () => {
      const { user } = await utils.givenUser();
      await api.get(`/users/${user.id}/judgements/assignments`).expect(401);
    });

    it('returns 403 when getting assignments without being the appropriate judge', async () => {
      const { user } = await utils.givenUser();
      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);

      await api
        .get(`/users/${user.id}/judgements/assignments`)
        .set('Authorization', `Bearer ${auth.token}`)
        .expect(403);
    });
  });

  describe('GET /users/{userId}/judgements/assignments/{competitionId}', () => {
    it('gets user judgement assignments in a competition', async () => {
      const { user, credentials } = await utils.givenUser();
      const competition = await utils.givenCompetition(user);
      const boulderingRound = await utils.addBoulderingRound(competition, {
        boulders: 1,
      });

      await utils.updateBoulderingGroupState(
        boulderingRound.groups.getItems()[0],
        BoulderingGroupState.ONGOING,
      );

      const boulder = boulderingRound.groups[0].boulders.getItems()[0];
      await utils.assignJudgeToBoulder(user, boulder);
      const auth = await utils.login(credentials);

      const { body } = await api
        .get(`/users/${user.id}/judgements/assignments/${competition.id}`)
        .set('Authorization', `Bearer ${auth.token}`)
        .expect(200);

      expect(body).toHaveLength(1);
      expect(body[0].competitionId).toEqual(competition.id);
      expect(body[0].roundId).toEqual(boulderingRound.id);
      expect(body[0].groupId).toEqual(boulderingRound.groups[0].id);
      expect(body[0].type).toEqual(CompetitionType.Bouldering);
      expect(body[0].assignedElementId).toEqual(boulder.id);
    });

    it('returns 401 when getting assignments without auth in a competition', async () => {
      const { user } = await utils.givenUser();
      await api.get(`/users/${user.id}/judgements/assignments/123`).expect(401);
    });

    it('returns 403 when getting assignments without being the appropriate judge in a competition', async () => {
      const { user } = await utils.givenUser();
      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);

      await api
        .get(`/users/${user.id}/judgements/assignments/123`)
        .set('Authorization', `Bearer ${auth.token}`)
        .expect(403);
    });
  });
});
