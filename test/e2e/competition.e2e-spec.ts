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
      const { user } = await utils.givenUser();
      const competition = await utils.givenCompetition(user);

      return api
        .get('/api/competitions')
        .expect(200)
        .then((res) => {
          expect(res.body.map((c: CompetitionDto) => c.id)).toContain(
            competition.id,
          );
        });
    });
  });

  describe('POST /competitions', () => {
    it('creates a competition', async function () {
      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);
      const competition = utils.givenCompetitionData();

      return api
        .post('/api/competitions')
        .set('Authorization', `Bearer ${auth.token}`)
        .send(competition)
        .expect(201)
        .then((res) => {
          expect(res.body.name).toEqual(competition.name);
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('updatedAt');
        });
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
          .put(`/api/competitions/${competition.id}/registrations/${user.id}`)
          .set('Authorization', `Bearer ${auth.token}`)
          .expect(204);

        const registrations = await utils.getRegistrations(competition);

        const registration = registrations.find(
          (r) =>
            r.competition.id === competition.id && r.climber.id === user.id,
        );

        expect(registration).toBeTruthy();
      });

      it('allows admin to create a registration for a user', async () => {
        const { user } = await utils.givenUser();
        const { credentials } = await utils.givenAdminUser();
        const auth = await utils.login(credentials);
        const competition = await utils.givenCompetition(user);
        utils.clearORM();

        await api
          .put(
            '/api/competitions/' + competition.id + '/registrations/' + user.id,
          )
          .set('Authorization', 'Bearer ' + auth.token)
          .expect(204);

        const registrations = await utils.getRegistrations(competition);
        const registration = registrations.find(
          (r) =>
            r.competition.id === competition.id && r.climber.id === user.id,
        );

        expect(registration).toBeTruthy();
      });

      it('returns 401 when unauthenticated user do not own the accessed user', async () => {
        await api
          .put('/api/competitions/999999/registrations/888888')
          .expect(401);
      });

      it('returns 403 when authenticated user do not own the accessed user', async () => {
        const { credentials } = await utils.givenUser();
        const auth = await utils.login(credentials);

        await api
          .put('/api/competitions/999999999/registrations/888888')
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
          .get(`/api/competitions/${competition.id}/registrations`)
          .expect(200);

        const registration = res.body.find(
          (r: CompetitionRegistrationDto) =>
            r.userId === user.id && r.competitionId === competition.id,
        );

        expect(registration).toBeTruthy();
        expect(registration).toHaveProperty('createdAt');
        expect(registration).toHaveProperty('updatedAt');
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
          .delete(
            `/api/competitions/${competition.id}/registrations/${user.id}`,
          )
          .set('Authorization', `Bearer ${auth.token}`)
          .expect(204);

        const registrations = await utils.getRegistrations(competition);

        const registration = registrations.find(
          (r) =>
            r.climber.id === user.id && r.competition.id === competition.id,
        );

        expect(registration).toBeUndefined();
      });

      it('returns 401 when unauthenticated user do not own the accessed user', async () => {
        await api
          .delete('/api/competitions/999999/registrations/888888')
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
            `/api/competitions/${competition.id}/registrations/${thirdUser.id}`,
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
            '/api/competitions/' + competition.id + '/registrations/' + user.id,
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
          .get(`/api/competitions/${competition.id}/jury-presidents`)
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
          .put(`/api/competitions/${competition.id}/jury-presidents/${user.id}`)
          .set('Authorization', `Bearer ${auth.token}`)
          .expect(204);

        const juryPresidents = await utils.getJuryPresidents(competition);
        const juryPresident = juryPresidents.find((jp) => jp.id === user.id);
        expect(juryPresident).toBeTruthy();
      });

      it('returns 401 when unauthenticated user do not own the accessed user', async () => {
        await api
          .put('/api/competitions/999999/jury-presidents/888888')
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
          .put(`/api/competitions/${competition.id}/jury-presidents/${user.id}`)
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
          .delete(
            `/api/competitions/${competition.id}/jury-presidents/${user.id}`,
          )
          .set('Authorization', `Bearer ${token.token}`)
          .expect(204);

        const juryPresidents = await utils.getJuryPresidents(competition);
        const juryPresident = juryPresidents.find((r) => r.id === user.id);
        expect(juryPresident).toBeUndefined();
      });

      it('returns 401 when unauthenticated user do not own the accessed user', async () => {
        await api
          .delete('/api/competitions/999999/jury-presidents/888888')
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
          .delete(
            `/api/competitions/${competition.id}/jury-presidents/${user.id}`,
          )
          .set('Authorization', `Bearer ${secondAuth.token}`)
          .expect(403);
      });
    });
  });

  describe('Judges', function () {
    describe('PUT /competitions/{competitionId}/judges/{userId}', () => {
      it('adds a juge', async function () {
        const { user, credentials } = await utils.givenUser();
        const token = await utils.login(credentials);
        const competition = await utils.givenCompetition(user);
        utils.clearORM();

        await api
          .put(`/api/competitions/${competition.id}/judges/${user.id}`)
          .set('Authorization', `Bearer ${token.token}`)
          .expect(204);

        const judges = await utils.getJudges(competition);
        const judge = judges.find((j) => j.id === user.id);
        expect(judge).toBeTruthy();
      });

      it('returns 401 when unauthenticated user do not own the accessed user', async () => {
        await api.put('/api/competitions/999999/judges/888888').expect(401);
      });

      it('returns 403 when a non organizer add a jury judge', async function () {
        const [{ user }, { credentials }] = [
          await utils.givenUser(),
          await utils.givenUser(),
        ];

        const secondAuth = await utils.login(credentials);
        const competition = await utils.givenCompetition(user);

        await api
          .put(`/api/competitions/${competition.id}/judges/${user.id}`)
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
          .get(`/api/competitions/${competition.id}/judges`)
          .expect(200);

        const judge = res.body.find((r: CompetitionDto) => r.id === user.id);
        expect(judge).toBeTruthy();
      });
    });

    describe('DELETE /competitions/{competitionId}/judges/{userId}', () => {
      it('removes a judge', async function () {
        const { credentials, user } = await utils.givenUser();
        const token = await utils.login(credentials);
        const competition = await utils.givenCompetition(user);
        await utils.addJudgeInCompetition(user, competition);
        utils.clearORM();

        await api
          .delete(`/api/competitions/${competition.id}/judges/${user.id}`)
          .set('Authorization', `Bearer ${token.token}`)
          .expect(204);

        const judges = await utils.getJudges(competition);
        const judge = judges.find((r) => r.id === user.id);
        expect(judge).toBeUndefined();
      });

      it('returns 401 when unauthenticated user do not own the accessed user', async () => {
        await api.delete('/api/competitions/999999/judges/888888').expect(401);
      });

      it('returns 403 when a non organizer remove a jury judge', async function () {
        const [{ user }, { credentials }] = [
          await utils.givenUser(),
          await utils.givenUser(),
        ];

        const secondAuth = await utils.login(credentials);
        const competition = await utils.givenCompetition(user);

        await api
          .delete(`/api/competitions/${competition.id}/judges/${user.id}`)
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
          .put(
            `/api/competitions/${competition.id}/chief-route-setters/${user.id}`,
          )
          .set('Authorization', `Bearer ${token.token}`)
          .expect(204);

        const chiefRouteSetters = await utils.getChiefRouteSetters(competition);
        const chiefRouteSetter = chiefRouteSetters.find(
          (j) => j.id === user.id,
        );

        expect(chiefRouteSetter).toBeTruthy();
      });

      it('returns 401 when unauthenticated user do not own the accessed user', async () => {
        await api
          .put('/api/competitions/999999/chief-route-setters/888888')
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
          .put(
            `/api/competitions/${competition.id}/chief-route-setters/${user.id}`,
          )
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
          .get(`/api/competitions/${competition.id}/chief-route-setters`)
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
            `/api/competitions/${competition.id}/chief-route-setters/${user.id}`,
          )
          .set('Authorization', `Bearer ${token.token}`)
          .expect(204);

        const chiefRouteSetters = await utils.getChiefRouteSetters(competition);
        const chiefRouteSetter = chiefRouteSetters.find(
          (r) => r.id === user.id,
        );

        expect(chiefRouteSetter).toBeUndefined();
      });

      it('returns 401 when unauthenticated user do not own the accessed user', async () => {
        await api
          .delete('/api/competitions/999999/chief-route-setters/888888')
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
            `/api/competitions/${competition.id}/chief-route-setters/${user.id}`,
          )
          .set('Authorization', `Bearer ${secondAuth.token}`)
          .expect(403);
      });
    });
  });

  describe('Route setters', function () {
    describe('PUT /competitions/{competitionId}/route-setters/{userId}', () => {
      it('adds route setter', async function () {
        const { credentials, user } = await utils.givenUser();
        const token = await utils.login(credentials);
        const competition = await utils.givenCompetition(user);
        utils.clearORM();

        await api
          .put(`/api/competitions/${competition.id}/route-setters/${user.id}`)
          .set('Authorization', `Bearer ${token.token}`)
          .expect(204);

        const routeSetters = await utils.getRouteSetters(competition);
        const routeSetter = routeSetters.find((j) => j.id === user.id);
        expect(routeSetter).toBeTruthy();
      });

      it('returns 401 when unauthenticated user do not own the accessed user', async () => {
        await api
          .put('/api/competitions/999999/route-setters/888888')
          .expect(401);
      });

      it('returns 403 when a non organizer add a route setter', async function () {
        const [{ user }, { credentials: secondUser }] = [
          await utils.givenUser(),
          await utils.givenUser(),
        ];

        const secondAuth = await utils.login(secondUser);
        const competition = await utils.givenCompetition(user);

        await api
          .put(`/api/competitions/${competition.id}/route-setters/${user.id}`)
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
          .get(`/api/competitions/${competition.id}/route-setters`)
          .expect(200);

        const routeSetter = res.body.find(
          (r: CompetitionDto) => r.id === user.id,
        );

        expect(routeSetter).toBeTruthy();
      });
    });

    describe('DELETE /competitions/{competitionId}/route-setters/{userId}', () => {
      it('removes a route setter', async function () {
        const { credentials, user } = await utils.givenUser();
        const token = await utils.login(credentials);
        const competition = await utils.givenCompetition(user);
        await utils.addRouteSetterInCompetition(user, competition);
        utils.clearORM();

        await api
          .delete(
            `/api/competitions/${competition.id}/route-setters/${user.id}`,
          )
          .set('Authorization', `Bearer ${token.token}`)
          .expect(204);

        const routeSetters = await utils.getRouteSetters(competition);
        const routeSetter = routeSetters.find((r) => r.id === user.id);
        expect(routeSetter).toBeUndefined();
      });

      it('returns 401 when unauthenticated user do not own the accessed user', async () => {
        await api
          .delete('/api/competitions/999999/route-setters/888888')
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
          .delete(
            `/api/competitions/${competition.id}/route-setters/${user.id}`,
          )
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
          .put(
            `/api/competitions/${competition.id}/technical-delegates/${user.id}`,
          )
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

      it('returns 401 when unauthenticated user do not own the accessed user', async () => {
        await api
          .put('/api/competitions/999999/technical-delegates/888888')
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
          .put(
            `/api/competitions/${competition.id}/technical-delegates/${user.id}`,
          )
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
          .get(`/api/competitions/${competition.id}/technical-delegates`)
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
            `/api/competitions/${competition.id}/technical-delegates/${user.id}`,
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

      it('returns 401 when unauthenticated user do not own the accessed user', async () => {
        await api
          .delete('/api/competitions/999999/technical-delegates/888888')
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
            `/api/competitions/${competition.id}/technical-delegates/${user.id}`,
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
          .put(
            `/api/competitions/${competition.id}/organizers/${secondUser.id}`,
          )
          .set('Authorization', `Bearer ${token.token}`)
          .expect(204);

        const organizers = await utils.getOrganizers(competition);
        const organizer = organizers.find((o) => o.id === secondUser.id);
        expect(organizer).toBeTruthy();
      });

      it('returns 401 when unauthenticated user do not own the accessed user', async () => {
        await api.put('/api/competitions/999999/organizers/888888').expect(401);
      });

      it('returns 403 when a non organizer add an organizer', async function () {
        const [{ user }, { credentials: secondUser }] = [
          await utils.givenUser(),
          await utils.givenUser(),
        ];

        const secondAuth = await utils.login(secondUser);
        const competition = await utils.givenCompetition(user);

        await api
          .put(`/api/competitions/${competition.id}/organizers/${user.id}`)
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
          .get(`/api/competitions/${competition.id}/organizers`)
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
          .delete(
            `/api/competitions/${competition.id}/organizers/${secondUser.id}`,
          )
          .set('Authorization', `Bearer ${userAuth.token}`)
          .expect(204);

        const organizers = await utils.getOrganizers(competition);
        const firstOrganizer = organizers.find((r) => r.id === user.id);
        const secondOrganizer = organizers.find((r) => r.id === secondUser.id);

        expect(firstOrganizer).toBeTruthy();
        expect(secondOrganizer).toBeUndefined();
      });

      it('returns 401 when unauthenticated user do not own the accessed user', async () => {
        await api
          .delete('/api/competitions/999999/organizers/888888')
          .expect(401);
      });

      it('returns 403 when a non organizer remove an organizer', async function () {
        const [{ user }, { credentials: secondUser }] = [
          await utils.givenUser(),
          await utils.givenUser(),
        ];

        const secondAuth = await utils.login(secondUser);
        const competition = await utils.givenCompetition(user);

        await api
          .delete(`/api/competitions/${competition.id}/organizers/${user.id}`)
          .set('Authorization', `Bearer ${secondAuth.token}`)
          .expect(403);
      });
    });
  });
});
