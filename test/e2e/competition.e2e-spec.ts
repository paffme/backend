import supertest from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { configure } from '../../src/app.configuration';
import TestUtils from '../utils';
import { NestExpressApplication } from '@nestjs/platform-express';
import { CompetitionDto } from '../../src/competition/dto/out/competition.dto';
import { CompetitionRegistrationDto } from '../../src/competition/dto/out/competition-registration.dto';
import { UserService } from '../../src/user/user.service';
import { CompetitionService } from '../../src/competition/competition.service';
import { givenCreateCompetitionDto } from '../fixture/competition.fixture';
import { UpdateCompetitionByIdDto } from '../../src/competition/dto/in/body/update-competition-by-id.dto';
import LinkHeader from 'http-link-header';
import { Sex } from '../../src/shared/types/sex.enum';
import { CategoryName } from '../../src/shared/types/category-name.enum';
import * as uuid from 'uuid';
import { CompetitionRoundType } from '../../src/competition/competition-round-type.enum';
import { CompetitionState } from '../../src/competition/competition.entity';
import { CompetitionType } from '../../src/competition/types/competition-type.enum';
import { BoulderingGroupState } from '../../src/bouldering/group/bouldering-group.entity';
import { BoulderingRoundRankingType } from '../../src/bouldering/round/bouldering-round.entity';
import { BoulderService } from '../../src/bouldering/boulder/boulder.service';
import { promises as fs } from 'fs';
/* eslint-disable sonarjs/no-duplicate-string */

describe('Competition (e2e)', () => {
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

  describe('GET /competitions', () => {
    it('retrieves competitions', async function () {
      const res = await api.get('/competitions').expect(200);
      expect(res.body).toBeInstanceOf(Array);
    });

    it('retrieves competitions with filtering and ordering', async function () {
      const { user } = await utils.givenUser();
      const now = new Date();
      now.setSeconds(now.getSeconds() + 10);

      const competition = await utils.givenCompetition(user, {
        startDate: now,
      });

      const res = await api
        .get('/competitions')
        .query({
          q: JSON.stringify({
            startDate: {
              $gte: new Date(),
            },
          }),
        })
        .expect(200);

      expect(res.body.map((c: CompetitionDto) => c.id)).toContain(
        competition.id,
      );
    });

    it('retrieves competitions with pagination', async function () {
      const { user } = await utils.givenUser();

      for (let i = 0; i < 2; i++) {
        await utils.givenCompetition(user);
      }

      const res = await api.get('/competitions?perPage=1').expect(200);
      expect(res.body).toHaveLength(1);
      expect(res.header).toHaveProperty('link');
      const linkHeader = LinkHeader.parse(res.header.link);
      const rels = linkHeader.refs.map((r) => r.rel);
      expect(rels).toContain('next');
      expect(rels).toContain('last');
    });
  });

  describe('GET /competitions/count', () => {
    it('count competitions', async () => {
      const { user } = await utils.givenUser();
      await utils.givenCompetition(user);

      const { body } = await api.get('/competitions/count').expect(200);

      expect(body.count).toBeGreaterThanOrEqual(1);
    });

    it('count competitions with filtering', async () => {
      const { user } = await utils.givenUser();
      const competition = await utils.givenCompetition(user, {
        name: uuid.v4(),
      });

      await utils.givenCompetition(user);

      const { body } = await api
        .get('/competitions/count')
        .query({
          q: JSON.stringify({
            name: {
              $eq: competition.name,
            },
          }),
        })
        .expect(200);

      expect(body.count).toEqual(1);
    });
  });

  describe('GET /competitions/{competitionId}', () => {
    it('gets a competition by id', async function () {
      const { user } = await utils.givenUser();
      const competition = await utils.givenCompetition(user);

      const { body } = await api
        .get(`/competitions/${competition.id}`)
        .expect(200);

      expect(body.id).toEqual(competition.id);
      expect(body.categories).toEqual(competition.categories);
      expect(body.name).toEqual(competition.name);
      expect(body.startDate).toEqual(competition.startDate.toISOString());
      expect(body.endDate).toEqual(competition.endDate.toISOString());
      expect(body.city).toEqual(competition.city);
      expect(body.address).toEqual(competition.address);
      expect(body.postalCode).toEqual(competition.postalCode);
      expect(body.type).toEqual(competition.type);
      expect(body).toHaveProperty('createdAt');
      expect(body).toHaveProperty('updatedAt');
    });

    it('returns 404 when getting an unknown competition', async () => {
      await api.get('/competitions/9999999').expect(404);
    });
  });

  describe('PATCH /competitions/{competitionId}', () => {
    it('updates a competition', async () => {
      const { user, credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);
      const competition = await utils.givenCompetition(user);

      const dto: UpdateCompetitionByIdDto = {
        name: 'New name',
      };

      const { body } = await api
        .patch(`/competitions/${competition.id}`)
        .set('Authorization', `Bearer ${auth.token}`)
        .send(dto)
        .expect(200);

      expect(body.id).toEqual(competition.id);
      expect(body.name).toEqual(dto.name);
    });

    it('prevents empty categories when updating', async () => {
      const { user, credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);
      const competition = await utils.givenCompetition(user);

      const dto: UpdateCompetitionByIdDto = {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        categories: [{}, {}],
      };

      const { body } = await api
        .patch(`/competitions/${competition.id}`)
        .set('Authorization', `Bearer ${auth.token}`)
        .send(dto)
        .expect(422);

      expect(body.errors[0].property).toEqual('categories');
    });

    it('returns 401 when an unauthenticated user try to update a competition', async () => {
      const { user } = await utils.givenUser();
      const competition = await utils.givenCompetition(user);
      const dto: UpdateCompetitionByIdDto = {};

      await api.patch(`/competitions/${competition.id}`).send(dto).expect(401);
    });

    it('returns 403 when someone that is not an organizer try to update a competition', async () => {
      const { user } = await utils.givenUser();
      const competition = await utils.givenCompetition(user);

      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);
      const dto: UpdateCompetitionByIdDto = {};

      await api
        .patch(`/competitions/${competition.id}`)
        .set('Authorization', `Bearer ${auth.token}`)
        .send(dto)
        .expect(403);
    });

    it('returns 404 when updating an unknown competition', async () => {
      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);
      const dto: UpdateCompetitionByIdDto = {};

      await api
        .patch('/competitions/9999999')
        .set('Authorization', `Bearer ${auth.token}`)
        .send(dto)
        .expect(404);
    });
  });

  describe('POST /competitions', () => {
    it('creates a competition', async function () {
      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);
      const competition = givenCreateCompetitionDto();

      const { body } = await api
        .post('/competitions')
        .set('Authorization', `Bearer ${auth.token}`)
        .send(competition)
        .expect(201);

      expect(body.name).toEqual(competition.name);
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('createdAt');
      expect(body).toHaveProperty('updatedAt');
    });

    it('creates a competition with category', async function () {
      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);
      const competition = givenCreateCompetitionDto({
        categories: [{ sex: Sex.Female, name: CategoryName.Benjamin }],
      });

      const { body } = await api
        .post('/competitions')
        .set('Authorization', `Bearer ${auth.token}`)
        .send(competition)
        .expect(201);

      expect(body.categories[0].sex).toEqual(Sex.Female);
      expect(body.categories[0].name).toEqual(CategoryName.Benjamin);
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('createdAt');
      expect(body).toHaveProperty('updatedAt');
    });

    it('prevents empty categories', async () => {
      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);
      const competition = givenCreateCompetitionDto({
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        categories: [{}, {}],
      });

      const { body } = await api
        .post('/competitions')
        .set('Authorization', `Bearer ${auth.token}`)
        .send(competition)
        .expect(422);

      expect(body.errors[0].property).toEqual('categories');
    });

    it('prevents empty categories (2)', async () => {
      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);
      const competition = givenCreateCompetitionDto({
        categories: [],
      });

      const { body } = await api
        .post('/competitions')
        .set('Authorization', `Bearer ${auth.token}`)
        .send(competition)
        .expect(422);

      expect(body.errors[0].property).toEqual('categories');
    });

    it('prevents empty name', async () => {
      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);
      const competition = givenCreateCompetitionDto({
        name: '',
      });

      const { body } = await api
        .post('/competitions')
        .set('Authorization', `Bearer ${auth.token}`)
        .send(competition)
        .expect(422);

      expect(body.errors[0].property).toEqual('name');
    });

    it('prevents empty address', async () => {
      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);
      const competition = givenCreateCompetitionDto({
        address: '',
      });

      const { body } = await api
        .post('/competitions')
        .set('Authorization', `Bearer ${auth.token}`)
        .send(competition)
        .expect(422);

      expect(body.errors[0].property).toEqual('address');
    });

    it('prevents empty city', async () => {
      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);
      const competition = givenCreateCompetitionDto({
        city: '',
      });

      const { body } = await api
        .post('/competitions')
        .set('Authorization', `Bearer ${auth.token}`)
        .send(competition)
        .expect(422);

      expect(body.errors[0].property).toEqual('city');
    });

    it('prevents empty postal code', async () => {
      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);
      const competition = givenCreateCompetitionDto({
        postalCode: '',
      });

      const { body } = await api
        .post('/competitions')
        .set('Authorization', `Bearer ${auth.token}`)
        .send(competition)
        .expect(422);

      expect(body.errors[0].property).toEqual('postalCode');
    });
  });

  describe('Registrations', function () {
    describe('PUT /competitions/{competitionId}/registrations/{userId}', () => {
      it('creates a registrations', async function () {
        const { user, credentials } = await utils.givenUser();
        const auth = await utils.login(credentials);
        const competition = await utils.givenCompetition(user);
        utils.clearORM();

        await api
          .put(`/competitions/${competition.id}/registrations/${user.id}`)
          .set('Authorization', `Bearer ${auth.token}`)
          .expect(204);

        const registrations = await utils.getRegistrations(competition);

        const registration = registrations.find(
          (r) =>
            r.competition.id === competition.id && r.climber.id === user.id,
        );

        expect(registration).toBeTruthy();
      });

      it('creates a registrations and add the user in the qualifier round', async function () {
        const { user, credentials } = await utils.givenUser();
        const auth = await utils.login(credentials);

        const competition = await utils.givenCompetition(user, {
          type: CompetitionType.Bouldering,
        });

        const qRound = await utils.addBoulderingRound(competition, {
          sex: user.sex,
          category: user.getCategory(competition.getSeason()).name,
          type: CompetitionRoundType.QUALIFIER,
        });

        utils.clearORM();

        await api
          .put(`/competitions/${competition.id}/registrations/${user.id}`)
          .set('Authorization', `Bearer ${auth.token}`)
          .expect(204);

        const registrations = await utils.getRegistrations(competition);

        const registration = registrations.find(
          (r) =>
            r.competition.id === competition.id && r.climber.id === user.id,
        );

        expect(registration).toBeTruthy();

        const group = await utils.getBoulderingGroup(
          qRound.groups.getItems()[0].id,
        );

        expect(group.climbers.getItems()[0].id).toEqual(user.id);
      });

      it('allows admin to create a registration for a user', async () => {
        const { user } = await utils.givenUser();
        const { credentials } = await utils.givenAdminUser();
        const auth = await utils.login(credentials);
        const competition = await utils.givenCompetition(user);
        utils.clearORM();

        await api
          .put('/competitions/' + competition.id + '/registrations/' + user.id)
          .set('Authorization', 'Bearer ' + auth.token)
          .expect(204);

        const registrations = await utils.getRegistrations(competition);
        const registration = registrations.find(
          (r) =>
            r.competition.id === competition.id && r.climber.id === user.id,
        );

        expect(registration).toBeTruthy();
      });

      it('returns 401 when unauthenticated user do not own the accessed user to get registrations', async () => {
        await api.put('/competitions/999999/registrations/888888').expect(401);
      });

      it('returns 403 when authenticated user do not own the accessed user', async () => {
        const { credentials } = await utils.givenUser();
        const auth = await utils.login(credentials);

        await api
          .put('/competitions/999999999/registrations/888888')
          .set('Authorization', 'Bearer ' + auth.token)
          .expect(403);
      });
    });

    describe('GET /competitions/{competitionId}/registrations', () => {
      it('gets registrations', async function () {
        const { user } = await utils.givenUser();
        const competition = await utils.givenCompetition(user);
        await utils.registerUserInCompetition(user, competition);

        const res = await api
          .get(`/competitions/${competition.id}/registrations`)
          .expect(200);

        const registration = res.body.find(
          (r: CompetitionRegistrationDto) =>
            r.userId === user.id && r.competitionId === competition.id,
        );

        expect(registration).toBeTruthy();
        expect(registration).toHaveProperty('createdAt');
        expect(registration).toHaveProperty('updatedAt');
      });

      it('gets registrations with pagination', async function () {
        const { user } = await utils.givenUser();
        const { user: user2 } = await utils.givenUser();
        const competition = await utils.givenCompetition(user);
        await utils.registerUserInCompetition(user, competition);
        await utils.registerUserInCompetition(user2, competition);
        utils.clearORM();

        const res = await api
          .get(`/competitions/${competition.id}/registrations?perPage=1`)
          .expect(200);

        expect(res.body).toHaveLength(1);
        expect(res.header).toHaveProperty('link');
        const linkHeader = LinkHeader.parse(res.header.link);
        const rels = linkHeader.refs.map((r) => r.rel);
        expect(rels).toContain('next');
        expect(rels).toContain('last');
      });
    });

    describe('DELETE /competitions/{competitionId}/registrations/{userId}', () => {
      it('deletes a registration', async function () {
        const { user, credentials } = await utils.givenUser();
        const auth = await utils.login(credentials);
        const competition = await utils.givenCompetition(user);
        await utils.registerUserInCompetition(user, competition);
        utils.clearORM();

        await api
          .delete(`/competitions/${competition.id}/registrations/${user.id}`)
          .set('Authorization', `Bearer ${auth.token}`)
          .expect(204);

        const registrations = await utils.getRegistrations(competition);

        const registration = registrations.find(
          (r) =>
            r.climber.id === user.id && r.competition.id === competition.id,
        );

        expect(registration).toBeUndefined();
      });

      it('returns 401 when unauthenticated user do not own the accessed user to delete registrations', async () => {
        await api
          .delete('/competitions/999999/registrations/888888')
          .expect(401);
      });

      it('returns 403 when authenticated user do not own the accessed user', async () => {
        const [{ user }, { credentials }, { user: thirdUser }] = [
          await utils.givenUser(),
          await utils.givenUser(),
          await utils.givenUser(),
        ];

        const secondAuth = await utils.login(credentials);
        const competition = await utils.givenCompetition(user);

        await api
          .delete(
            `/competitions/${competition.id}/registrations/${thirdUser.id}`,
          )
          .set('Authorization', 'Bearer ' + secondAuth.token)
          .expect(403);
      });

      it('allows admin to delete a registration for a user', async () => {
        const { user } = await utils.givenUser();
        const { credentials: adminCredentials } = await utils.givenAdminUser();
        const auth = await utils.login(adminCredentials);
        const competition = await utils.givenCompetition(user);
        await utils.registerUserInCompetition(user, competition);
        utils.clearORM();

        await api
          .delete(
            '/competitions/' + competition.id + '/registrations/' + user.id,
          )
          .set('Authorization', 'Bearer ' + auth.token)
          .expect(204);

        const registrations = await utils.getRegistrations(competition);

        const registration = registrations.find(
          (r) =>
            r.climber.id === user.id && r.competition.id === competition.id,
        );

        expect(registration).toBeUndefined();
      });
    });
  });

  describe('Jury presidents', function () {
    describe('GET /competitions/{competitionId}/jury-presidents', () => {
      it('retrieves jury presidents', async function () {
        const { user } = await utils.givenUser();
        const competition = await utils.givenCompetition(user);
        await utils.addJuryPresidentInCompetition(user, competition);
        utils.clearORM();

        const res = await api
          .get(`/competitions/${competition.id}/jury-presidents`)
          .expect(200);

        const juryPresident = res.body.find(
          (r: CompetitionDto) => r.id === user.id,
        );

        expect(juryPresident).toBeTruthy();
      });
    });

    describe('PUT /competitions/{competitionId}/jury-presidents/{userId}', () => {
      it('adds a jury president', async function () {
        const { user, credentials } = await utils.givenUser();
        const auth = await utils.login(credentials);
        const competition = await utils.givenCompetition(user);
        utils.clearORM();

        await api
          .put(`/competitions/${competition.id}/jury-presidents/${user.id}`)
          .set('Authorization', `Bearer ${auth.token}`)
          .expect(204);

        const juryPresidents = await utils.getJuryPresidents(competition);
        const juryPresident = juryPresidents.find((jp) => jp.id === user.id);
        expect(juryPresident).toBeTruthy();
      });

      it('returns 401 when unauthenticated user do not own the accessed user to add jury president', async () => {
        await api
          .put('/competitions/999999/jury-presidents/888888')
          .expect(401);
      });

      it('returns 403 when a non organizer add a jury president', async function () {
        const [{ user }, { credentials }] = [
          await utils.givenUser(),
          await utils.givenUser(),
        ];

        const secondAuth = await utils.login(credentials);
        const competition = await utils.givenCompetition(user);

        await api
          .put(`/competitions/${competition.id}/jury-presidents/${user.id}`)
          .set('Authorization', `Bearer ${secondAuth.token}`)
          .expect(403);
      });
    });

    describe('DELETE /competitions/{competitionId}/jury-presidents/{userId}', () => {
      it('deletes a jury president', async function () {
        const { user, credentials } = await utils.givenUser();
        const token = await utils.login(credentials);
        const competition = await utils.givenCompetition(user);
        await utils.addJuryPresidentInCompetition(user, competition);
        utils.clearORM();

        await api
          .delete(`/competitions/${competition.id}/jury-presidents/${user.id}`)
          .set('Authorization', `Bearer ${token.token}`)
          .expect(204);

        const juryPresidents = await utils.getJuryPresidents(competition);
        const juryPresident = juryPresidents.find((r) => r.id === user.id);
        expect(juryPresident).toBeUndefined();
      });

      it('returns 401 when unauthenticated user do not own the accessed user to delete a jury president', async () => {
        await api
          .delete('/competitions/999999/jury-presidents/888888')
          .expect(401);
      });

      it('returns 403 when a non organizer remove a jury president', async function () {
        const [{ user }, { credentials }] = [
          await utils.givenUser(),
          await utils.givenUser(),
        ];

        const secondAuth = await utils.login(credentials);
        const competition = await utils.givenCompetition(user);

        await api
          .delete(`/competitions/${competition.id}/jury-presidents/${user.id}`)
          .set('Authorization', `Bearer ${secondAuth.token}`)
          .expect(403);
      });
    });
  });

  describe('Judges', function () {
    describe('PUT /competitions/{competitionId}/judges/{userId}', () => {
      it('adds a juge as an organizer', async function () {
        const { user, credentials } = await utils.givenUser();
        const token = await utils.login(credentials);
        const competition = await utils.givenCompetition(user);
        utils.clearORM();

        await api
          .put(`/competitions/${competition.id}/judges/${user.id}`)
          .set('Authorization', `Bearer ${token.token}`)
          .expect(204);

        const judges = await utils.getJudges(competition);
        const judge = judges.find((j) => j.id === user.id);
        expect(judge).toBeTruthy();
      });

      it('adds a juge as a jury president', async function () {
        const { user } = await utils.givenUser();
        const { user: juryPresident, credentials } = await utils.givenUser();
        const auth = await utils.login(credentials);
        const competition = await utils.givenCompetition(user);
        await utils.addJuryPresidentInCompetition(juryPresident, competition);
        utils.clearORM();

        await api
          .put(`/competitions/${competition.id}/judges/${user.id}`)
          .set('Authorization', `Bearer ${auth.token}`)
          .expect(204);

        const judges = await utils.getJudges(competition);
        const judge = judges.find((j) => j.id === user.id);
        expect(judge).toBeTruthy();
      });

      it('returns 401 when unauthenticated user do not own the accessed user to add a judge', async () => {
        await api.put('/competitions/999999/judges/888888').expect(401);
      });

      it('returns 403 when a non organizer add a jury judge', async function () {
        const [{ user }, { credentials }] = [
          await utils.givenUser(),
          await utils.givenUser(),
        ];

        const secondAuth = await utils.login(credentials);
        const competition = await utils.givenCompetition(user);

        await api
          .put(`/competitions/${competition.id}/judges/${user.id}`)
          .set('Authorization', `Bearer ${secondAuth.token}`)
          .expect(403);
      });
    });

    describe('GET /competitions/{competitionId}/judges', () => {
      it('retrieves judges', async function () {
        const { user } = await utils.givenUser();
        const competition = await utils.givenCompetition(user);
        await utils.addJudgeInCompetition(user, competition);

        const res = await api
          .get(`/competitions/${competition.id}/judges`)
          .expect(200);

        const judge = res.body.find((r: CompetitionDto) => r.id === user.id);
        expect(judge).toBeTruthy();
      });
    });

    describe('DELETE /competitions/{competitionId}/judges/{userId}', () => {
      it('removes a judge as an organizer', async function () {
        const { credentials, user } = await utils.givenUser();
        const token = await utils.login(credentials);
        const competition = await utils.givenCompetition(user);
        await utils.addJudgeInCompetition(user, competition);
        utils.clearORM();

        await api
          .delete(`/competitions/${competition.id}/judges/${user.id}`)
          .set('Authorization', `Bearer ${token.token}`)
          .expect(204);

        const judges = await utils.getJudges(competition);
        const judge = judges.find((r) => r.id === user.id);
        expect(judge).toBeUndefined();
      });

      it('removes a judge as a jury president', async function () {
        const { user } = await utils.givenUser();
        const { user: juryPresident, credentials } = await utils.givenUser();
        const token = await utils.login(credentials);
        const competition = await utils.givenCompetition(user);
        await utils.addJuryPresidentInCompetition(juryPresident, competition);
        await utils.addJudgeInCompetition(user, competition);
        utils.clearORM();

        await api
          .delete(`/competitions/${competition.id}/judges/${user.id}`)
          .set('Authorization', `Bearer ${token.token}`)
          .expect(204);

        const judges = await utils.getJudges(competition);
        const judge = judges.find((r) => r.id === user.id);
        expect(judge).toBeUndefined();
      });

      it('returns 401 when unauthenticated user do not own the accessed user to get judges', async () => {
        await api.delete('/competitions/999999/judges/888888').expect(401);
      });

      it('returns 403 when a non organizer remove a jury judge', async function () {
        const [{ user }, { credentials }] = [
          await utils.givenUser(),
          await utils.givenUser(),
        ];

        const secondAuth = await utils.login(credentials);
        const competition = await utils.givenCompetition(user);

        await api
          .delete(`/competitions/${competition.id}/judges/${user.id}`)
          .set('Authorization', `Bearer ${secondAuth.token}`)
          .expect(403);
      });
    });
  });

  describe('Chief route setters', function () {
    describe('PUT /competitions/{competitionId}/chief-route-setters/{userId}', () => {
      it('adds a chief route setter', async function () {
        const { credentials, user } = await utils.givenUser();
        const token = await utils.login(credentials);
        const competition = await utils.givenCompetition(user);
        utils.clearORM();

        await api
          .put(`/competitions/${competition.id}/chief-route-setters/${user.id}`)
          .set('Authorization', `Bearer ${token.token}`)
          .expect(204);

        const chiefRouteSetters = await utils.getChiefRouteSetters(competition);
        const chiefRouteSetter = chiefRouteSetters.find(
          (j) => j.id === user.id,
        );

        expect(chiefRouteSetter).toBeTruthy();
      });

      it('returns 401 when unauthenticated user do not own the accessed user to add a chief route setter', async () => {
        await api
          .put('/competitions/999999/chief-route-setters/888888')
          .expect(401);
      });

      it('returns 403 when a non organizer add a chief route setter', async function () {
        const [{ user }, { credentials: secondUser }] = [
          await utils.givenUser(),
          await utils.givenUser(),
        ];

        const secondAuth = await utils.login(secondUser);
        const competition = await utils.givenCompetition(user);

        await api
          .put(`/competitions/${competition.id}/chief-route-setters/${user.id}`)
          .set('Authorization', `Bearer ${secondAuth.token}`)
          .expect(403);
      });
    });

    describe('GET /competitions/{competitionId}/chief-route-setters', () => {
      it('retrieves chief route setters', async function () {
        const { user } = await utils.givenUser();
        const competition = await utils.givenCompetition(user);
        await utils.addChiefRouteSetterInCompetition(user, competition);
        utils.clearORM();

        const res = await api
          .get(`/competitions/${competition.id}/chief-route-setters`)
          .expect(200);

        const chiefRouteSetter = res.body.find(
          (r: CompetitionDto) => r.id === user.id,
        );

        expect(chiefRouteSetter).toBeTruthy();
      });
    });

    describe('DELETE /competitions/{competitionId}/chief-route-setters/{userId}', () => {
      it('removes chief route setter', async function () {
        const { credentials, user } = await utils.givenUser();
        const token = await utils.login(credentials);
        const competition = await utils.givenCompetition(user);
        await utils.addChiefRouteSetterInCompetition(user, competition);
        utils.clearORM();

        await api
          .delete(
            `/competitions/${competition.id}/chief-route-setters/${user.id}`,
          )
          .set('Authorization', `Bearer ${token.token}`)
          .expect(204);

        const chiefRouteSetters = await utils.getChiefRouteSetters(competition);
        const chiefRouteSetter = chiefRouteSetters.find(
          (r) => r.id === user.id,
        );

        expect(chiefRouteSetter).toBeUndefined();
      });

      it('returns 401 when unauthenticated user do not own the accessed user to delete a chief route setter', async () => {
        await api
          .delete('/competitions/999999/chief-route-setters/888888')
          .expect(401);
      });

      it('returns 403 when a non organizer remove a chief route setter', async function () {
        const [{ user }, { credentials: secondUser }] = [
          await utils.givenUser(),
          await utils.givenUser(),
        ];

        const secondAuth = await utils.login(secondUser);
        const competition = await utils.givenCompetition(user);

        await api
          .delete(
            `/competitions/${competition.id}/chief-route-setters/${user.id}`,
          )
          .set('Authorization', `Bearer ${secondAuth.token}`)
          .expect(403);
      });
    });
  });

  describe('Route setters', function () {
    describe('PUT /competitions/{competitionId}/route-setters/{userId}', () => {
      it('adds route setter as an organizer', async function () {
        const { credentials, user } = await utils.givenUser();
        const token = await utils.login(credentials);
        const competition = await utils.givenCompetition(user);
        utils.clearORM();

        await api
          .put(`/competitions/${competition.id}/route-setters/${user.id}`)
          .set('Authorization', `Bearer ${token.token}`)
          .expect(204);

        const routeSetters = await utils.getRouteSetters(competition);
        const routeSetter = routeSetters.find((j) => j.id === user.id);
        expect(routeSetter).toBeTruthy();
      });

      it('adds route setter as a chief route setter', async function () {
        const { user } = await utils.givenUser();
        const { user: chiefRouteSetter, credentials } = await utils.givenUser();
        const auth = await utils.login(credentials);
        const competition = await utils.givenCompetition(user);
        await utils.addChiefRouteSetterInCompetition(
          chiefRouteSetter,
          competition,
        );

        utils.clearORM();

        await api
          .put(`/competitions/${competition.id}/route-setters/${user.id}`)
          .set('Authorization', `Bearer ${auth.token}`)
          .expect(204);

        const routeSetters = await utils.getRouteSetters(competition);
        const routeSetter = routeSetters.find((j) => j.id === user.id);
        expect(routeSetter).toBeTruthy();
      });

      it('returns 401 when unauthenticated user do not own the accessed user to add a route setter', async () => {
        await api.put('/competitions/999999/route-setters/888888').expect(401);
      });

      it('returns 403 when a non organizer add a route setter', async function () {
        const [{ user }, { credentials: secondUser }] = [
          await utils.givenUser(),
          await utils.givenUser(),
        ];

        const secondAuth = await utils.login(secondUser);
        const competition = await utils.givenCompetition(user);

        await api
          .put(`/competitions/${competition.id}/route-setters/${user.id}`)
          .set('Authorization', `Bearer ${secondAuth.token}`)
          .expect(403);
      });
    });

    describe('GET /competitions/{competitionId}/route-setters', () => {
      it('retrieves route setters', async function () {
        const { user } = await utils.givenUser();
        const competition = await utils.givenCompetition(user);
        await utils.addRouteSetterInCompetition(user, competition);
        utils.clearORM();

        const res = await api
          .get(`/competitions/${competition.id}/route-setters`)
          .expect(200);

        const routeSetter = res.body.find(
          (r: CompetitionDto) => r.id === user.id,
        );

        expect(routeSetter).toBeTruthy();
      });
    });

    describe('DELETE /competitions/{competitionId}/route-setters/{userId}', () => {
      it('removes a route setter as an organizer', async function () {
        const { credentials, user } = await utils.givenUser();
        const token = await utils.login(credentials);
        const competition = await utils.givenCompetition(user);
        await utils.addRouteSetterInCompetition(user, competition);
        utils.clearORM();

        await api
          .delete(`/competitions/${competition.id}/route-setters/${user.id}`)
          .set('Authorization', `Bearer ${token.token}`)
          .expect(204);

        const routeSetters = await utils.getRouteSetters(competition);
        const routeSetter = routeSetters.find((r) => r.id === user.id);
        expect(routeSetter).toBeUndefined();
      });

      it('removes a route setter as a chief route setter', async function () {
        const { user } = await utils.givenUser();
        const { user: chiefRouteSetter, credentials } = await utils.givenUser();
        const auth = await utils.login(credentials);
        const competition = await utils.givenCompetition(user);
        await utils.addChiefRouteSetterInCompetition(
          chiefRouteSetter,
          competition,
        );
        await utils.addRouteSetterInCompetition(user, competition);
        utils.clearORM();

        await api
          .delete(`/competitions/${competition.id}/route-setters/${user.id}`)
          .set('Authorization', `Bearer ${auth.token}`)
          .expect(204);

        const routeSetters = await utils.getRouteSetters(competition);
        const routeSetter = routeSetters.find((r) => r.id === user.id);
        expect(routeSetter).toBeUndefined();
      });

      it('returns 401 when unauthenticated user do not own the accessed user to delete a route setter', async () => {
        await api
          .delete('/competitions/999999/route-setters/888888')
          .expect(401);
      });

      it('returns 403 when a non organizer remove a route setter', async function () {
        const [{ user }, { credentials: secondUser }] = [
          await utils.givenUser(),
          await utils.givenUser(),
        ];

        const secondAuth = await utils.login(secondUser);
        const competition = await utils.givenCompetition(user);

        await api
          .delete(`/competitions/${competition.id}/route-setters/${user.id}`)
          .set('Authorization', `Bearer ${secondAuth.token}`)
          .expect(403);
      });
    });
  });

  describe('Technical delegates', function () {
    describe('PUT /competitions/{competitionId}/technical-delegates/{userId}', () => {
      it('adds a technical delegate', async function () {
        const { user, credentials } = await utils.givenUser();
        const token = await utils.login(credentials);
        const competition = await utils.givenCompetition(user);
        utils.clearORM();

        await api
          .put(`/competitions/${competition.id}/technical-delegates/${user.id}`)
          .set('Authorization', `Bearer ${token.token}`)
          .expect(204);

        const technicalDelegates = await utils.getTechnicalDelegates(
          competition,
        );

        const technicalDelegate = technicalDelegates.find(
          (j) => j.id === user.id,
        );

        expect(technicalDelegate).toBeTruthy();
      });

      it('returns 401 when unauthenticated user do not own the accessed user to add a technical delegate', async () => {
        await api
          .put('/competitions/999999/technical-delegates/888888')
          .expect(401);
      });

      it('returns 403 when a non organizer add a technical delegate', async function () {
        const [{ user }, { credentials: secondUser }] = [
          await utils.givenUser(),
          await utils.givenUser(),
        ];

        const secondAuth = await utils.login(secondUser);
        const competition = await utils.givenCompetition(user);
        utils.clearORM();

        await api
          .put(`/competitions/${competition.id}/technical-delegates/${user.id}`)
          .set('Authorization', `Bearer ${secondAuth.token}`)
          .expect(403);
      });
    });

    describe('GET /competitions/{competitionId}/technical-delegates', () => {
      it('retrieves technical delegates', async function () {
        const { user } = await utils.givenUser();
        const competition = await utils.givenCompetition(user);
        await utils.addTechnicalDelegateInCompetition(user, competition);
        utils.clearORM();

        const res = await api
          .get(`/competitions/${competition.id}/technical-delegates`)
          .expect(200);

        const technicalDelegate = res.body.find(
          (r: CompetitionDto) => r.id === user.id,
        );

        expect(technicalDelegate).toBeTruthy();
      });
    });

    describe('DELETE /competitions/{competitionId}/technical-delegates/{userId}', () => {
      it('removes a technical delegate', async function () {
        const { credentials, user } = await utils.givenUser();
        const token = await utils.login(credentials);
        const competition = await utils.givenCompetition(user);
        await utils.addTechnicalDelegateInCompetition(user, competition);
        utils.clearORM();

        await api
          .delete(
            `/competitions/${competition.id}/technical-delegates/${user.id}`,
          )
          .set('Authorization', `Bearer ${token.token}`)
          .expect(204);

        const technicalDelegates = await utils.getTechnicalDelegates(
          competition,
        );

        const technicalDelegate = technicalDelegates.find(
          (r) => r.id === user.id,
        );

        expect(technicalDelegate).toBeUndefined();
      });

      it('returns 401 when unauthenticated user do not own the accessed user to delete a technical delegate', async () => {
        await api
          .delete('/competitions/999999/technical-delegates/888888')
          .expect(401);
      });

      it('returns 403 when a non organizer delete a technical delegate', async function () {
        const [{ user }, { credentials: secondUser }] = [
          await utils.givenUser(),
          await utils.givenUser(),
        ];

        const secondAuth = await utils.login(secondUser);
        const competition = await utils.givenCompetition(user);

        await api
          .delete(
            `/competitions/${competition.id}/technical-delegates/${user.id}`,
          )
          .set('Authorization', `Bearer ${secondAuth.token}`)
          .expect(403);
      });
    });
  });

  describe('Organizers', function () {
    describe('PUT /competitions/{competitionId}/organizers/{userId}', () => {
      it('add an organizer', async function () {
        const [{ user, credentials }, { user: secondUser }] = [
          await utils.givenUser(),
          await utils.givenUser(),
        ];

        const token = await utils.login(credentials);
        const competition = await utils.givenCompetition(user);
        utils.clearORM();

        await api
          .put(`/competitions/${competition.id}/organizers/${secondUser.id}`)
          .set('Authorization', `Bearer ${token.token}`)
          .expect(204);

        const organizers = await utils.getOrganizers(competition);
        const organizer = organizers.find((o) => o.id === secondUser.id);
        expect(organizer).toBeTruthy();
      });

      it('returns 401 when unauthenticated user do not own the accessed user', async () => {
        await api.put('/competitions/999999/organizers/888888').expect(401);
      });

      it('returns 403 when a non organizer add an organizer', async function () {
        const [{ user }, { credentials: secondUser }] = [
          await utils.givenUser(),
          await utils.givenUser(),
        ];

        const secondAuth = await utils.login(secondUser);
        const competition = await utils.givenCompetition(user);

        await api
          .put(`/competitions/${competition.id}/organizers/${user.id}`)
          .set('Authorization', `Bearer ${secondAuth.token}`)
          .expect(403);
      });
    });

    describe('GET /competitions/{competitionId}/organizers', () => {
      it('retrieves organizers', async function () {
        const { user } = await utils.givenUser();
        const competition = await utils.givenCompetition(user);
        utils.clearORM();

        const res = await api
          .get(`/competitions/${competition.id}/organizers`)
          .expect(200);

        const organizer = res.body.find(
          (r: CompetitionDto) => r.id === user.id,
        );

        expect(organizer).toBeTruthy();
      });
    });

    describe('DELETE /competitions/{competitionId}/organizers/{userId}', () => {
      it('removes an organizer', async function () {
        const { user, credentials } = await utils.givenUser();
        const { user: secondUser } = await utils.givenUser();
        const userAuth = await utils.login(credentials);
        const competition = await utils.givenCompetition(user);
        await utils.addOrganizerInCompetition(secondUser, competition);
        utils.clearORM();

        await api
          .delete(`/competitions/${competition.id}/organizers/${secondUser.id}`)
          .set('Authorization', `Bearer ${userAuth.token}`)
          .expect(204);

        const organizers = await utils.getOrganizers(competition);
        const firstOrganizer = organizers.find((r) => r.id === user.id);
        const secondOrganizer = organizers.find((r) => r.id === secondUser.id);

        expect(firstOrganizer).toBeTruthy();
        expect(secondOrganizer).toBeUndefined();
      });

      it('returns 401 when unauthenticated user do not own the accessed user', async () => {
        await api.delete('/competitions/999999/organizers/888888').expect(401);
      });

      it('returns 403 when a non organizer remove an organizer', async function () {
        const [{ user }, { credentials: secondUser }] = [
          await utils.givenUser(),
          await utils.givenUser(),
        ];

        const secondAuth = await utils.login(secondUser);
        const competition = await utils.givenCompetition(user);

        await api
          .delete(`/competitions/${competition.id}/organizers/${user.id}`)
          .set('Authorization', `Bearer ${secondAuth.token}`)
          .expect(403);
      });
    });
  });

  describe('PATCH /competitions/{competitionId}/start-qualifiers', () => {
    it('starts qualifiers rounds', async () => {
      const { user, credentials } = await utils.givenUser();
      const competition = await utils.givenCompetition(user);
      const auth = await utils.login(credentials);
      await utils.addJuryPresidentInCompetition(user, competition);

      const qRound = await utils.addBoulderingRound(competition, {
        type: CompetitionRoundType.QUALIFIER,
      });

      await utils.addBoulderingRound(competition, {
        type: CompetitionRoundType.SEMI_FINAL,
      });

      await utils.addBoulderingRound(competition, {
        type: CompetitionRoundType.FINAL,
      });

      const { body } = await api
        .patch(`/competitions/${competition.id}/start-qualifiers`)
        .set('Authorization', `Bearer ${auth.token}`)
        .expect(200);

      expect(body).toHaveLength(1);
      expect(body[0].id).toEqual(qRound.id);
      expect(body[0].state).toEqual(CompetitionState.ONGOING);
    });

    it('returns 401 when trying to start qualifiers without auth', async () => {
      const { user } = await utils.givenUser();
      const competition = await utils.givenCompetition(user);

      await api
        .patch(`/competitions/${competition.id}/start-qualifiers`)
        .expect(401);
    });

    it('returns 403 when starting qualifiers without being jury president', async () => {
      const { user, credentials } = await utils.givenUser();
      const competition = await utils.givenCompetition(user);
      const auth = await utils.login(credentials);

      await api
        .patch(`/competitions/${competition.id}/start-qualifiers`)
        .set('Authorization', `Bearer ${auth.token}`)
        .expect(403);
    });
  });

  describe('PATCH /competitions/{competitionId}/start-semi-finals', () => {
    it('starts semi finals rounds', async () => {
      const { user, credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);

      const competition = await utils.givenCompetition(user, {
        type: CompetitionType.Bouldering,
      });

      await utils.addJuryPresidentInCompetition(user, competition);

      const { user: climber } = await utils.givenUser();
      const category = climber.getCategory(competition.getSeason());
      await utils.registerUserInCompetition(climber, competition);

      const qRound = await utils.addBoulderingRound(competition, {
        type: CompetitionRoundType.QUALIFIER,
        category: category.name,
        sex: category.sex,
      });

      await utils.updateBoulderingGroupState(
        qRound.groups[0],
        BoulderingGroupState.ONGOING,
      );

      await utils.addBoulderingResult(
        competition,
        qRound,
        qRound.groups[0],
        qRound.groups[0].boulders[0],
        climber,
      );

      const sRound = await utils.addBoulderingRound(competition, {
        type: CompetitionRoundType.SEMI_FINAL,
        category: category.name,
        sex: category.sex,
      });

      await utils.addBoulderingRound(competition, {
        type: CompetitionRoundType.FINAL,
        category: category.name,
        sex: category.sex,
      });

      const { body } = await api
        .patch(`/competitions/${competition.id}/start-semi-finals`)
        .set('Authorization', `Bearer ${auth.token}`)
        .expect(200);

      expect(body).toHaveLength(1);
      expect(body[0].id).toEqual(sRound.id);
      expect(body[0].state).toEqual(CompetitionState.ONGOING);
    });

    it('returns 401 when trying to start semi-finals without auth', async () => {
      const { user } = await utils.givenUser();
      const competition = await utils.givenCompetition(user);

      await api
        .patch(`/competitions/${competition.id}/start-semi-finals`)
        .expect(401);
    });

    it('returns 403 when starting semi-finals without being jury president', async () => {
      const { user, credentials } = await utils.givenUser();
      const competition = await utils.givenCompetition(user);
      const auth = await utils.login(credentials);

      await api
        .patch(`/competitions/${competition.id}/start-semi-finals`)
        .set('Authorization', `Bearer ${auth.token}`)
        .expect(403);
    });
  });

  describe('PATCH /competitions/{competitionId}/start-finals', () => {
    it('starts finals rounds', async () => {
      // INIT COMPETITION
      const { user, credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);

      const competition = await utils.givenCompetition(user, {
        type: CompetitionType.Bouldering,
      });

      await utils.addJuryPresidentInCompetition(user, competition);

      const { user: climber } = await utils.givenUser();
      const category = climber.getCategory(competition.getSeason());
      await utils.registerUserInCompetition(climber, competition);

      // START QUALIFIER ROUND
      const qRound = await utils.addBoulderingRound(competition, {
        type: CompetitionRoundType.QUALIFIER,
        category: category.name,
        sex: category.sex,
      });

      await utils.startQualifiers(competition);

      await utils.addBoulderingResult(
        competition,
        qRound,
        qRound.groups[0],
        qRound.groups[0].boulders[0],
        climber,
      );

      // START SEMI FINAL ROUND
      const sRound = await utils.addBoulderingRound(competition, {
        type: CompetitionRoundType.SEMI_FINAL,
        category: category.name,
        sex: category.sex,
      });

      await utils.startSemiFinals(competition);

      await utils.addBoulderingResult(
        competition,
        sRound,
        sRound.groups[0],
        sRound.groups[0].boulders[0],
        climber,
      );

      // FINALLY START THE FINAL ROUND
      const fRound = await utils.addBoulderingRound(competition, {
        type: CompetitionRoundType.FINAL,
        category: category.name,
        sex: category.sex,
      });

      const { body } = await api
        .patch(`/competitions/${competition.id}/start-finals`)
        .set('Authorization', `Bearer ${auth.token}`)
        .expect(200);

      expect(body).toHaveLength(1);
      expect(body[0].id).toEqual(fRound.id);
      expect(body[0].state).toEqual(CompetitionState.ONGOING);
    });

    it('returns 401 when trying to start finals without auth', async () => {
      const { user } = await utils.givenUser();
      const competition = await utils.givenCompetition(user);

      await api
        .patch(`/competitions/${competition.id}/start-finals`)
        .expect(401);
    });

    it('returns 403 when starting finals without being jury president', async () => {
      const { user, credentials } = await utils.givenUser();
      const competition = await utils.givenCompetition(user);
      const auth = await utils.login(credentials);

      await api
        .patch(`/competitions/${competition.id}/start-finals`)
        .set('Authorization', `Bearer ${auth.token}`)
        .expect(403);
    });
  });

  describe('GET /competitions/{competitionId}/rankings/pdf', () => {
    it('gets the competition ranking in PDF', async () => {
      const {
        climber,
        competition,
        round,
        boulder,
      } = await utils.givenReadyCompetition(BoulderingRoundRankingType.CIRCUIT);

      await utils.addBoulderingResult(
        competition,
        round,
        round.groups[0],
        boulder,
        climber,
        {
          top: true,
          zone: true,
          try: 1,
        },
      );

      // const sRound = await utils.addBoulderingRound(competition, {
      //   type: CompetitionRoundType.SEMI_FINAL,
      //   rankingType: BoulderingRoundRankingType.CIRCUIT,
      //   boulders: 1,
      // });
      //
      // await utils.startSemiFinals(competition);
      //
      // await utils.addBoulderingResult(
      //   competition,
      //   sRound,
      //   sRound.groups[0],
      //   sRound.groups[0].boulders[0],
      //   climber,
      //   {
      //     top: true,
      //     zone: true,
      //     try: 1,
      //   },
      // );

      // const fRound = await utils.addBoulderingRound(competition, {
      //   type: CompetitionRoundType.FINAL,
      //   rankingType: BoulderingRoundRankingType.CIRCUIT,
      //   boulders: 1,
      // });
      //
      // await utils.startFinals(competition);
      //
      // await utils.addBoulderingResult(
      //   competition,
      //   fRound,
      //   fRound.groups[0],
      //   fRound.groups[0].boulders[0],
      //   climber,
      //   {
      //     top: true,
      //     zone: true,
      //     try: 1,
      //   },
      // );

      const { user: anotherClimber } = await utils.givenUser({
        sex: Sex.Male,
        birthYear: 1970,
      });

      await utils.registerUserInCompetition(anotherClimber, competition);

      const vetQRound = await utils.addBoulderingRound(competition, {
        type: CompetitionRoundType.QUALIFIER,
        rankingType: BoulderingRoundRankingType.CIRCUIT,
        category: CategoryName.Veteran,
        sex: Sex.Male,
      });

      await utils.startQualifiers(competition);

      await utils.addBoulderingResult(
        competition,
        vetQRound,
        vetQRound.groups[0],
        vetQRound.groups[0].boulders[0],
        anotherClimber,
        {
          top: true,
          zone: true,
          try: 1,
        },
      );

      // FIXME: go from the final to the qualifier round to build
      // FIXME: the ranking tables
      // TODO: test unlimited contest
      // TODO: test mixing unlimited with circuit

      const res = await api
        .get(`/competitions/${competition.id}/rankings/pdf`)
        .expect(200);

      expect(res.header['content-type']).toEqual('application/pdf');
      await fs.writeFile('out.pdf', res.body);
    });
  });
});
