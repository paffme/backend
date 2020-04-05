import supertest from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { configure } from '../../src/app.configuration';
import TestUtils from './utils';
import { ConfigurationService } from '../../src/shared/configuration/configuration.service';
import { CompetitionService } from '../../src/competition/competition.service';
import { CreateCompetitionRegistrationDto } from '../../src/competition/dto/in/body/create-competition-registration.dto';
import { AddJuryPresidentDto } from '../../src/competition/dto/in/body/add-jury-president.dto';
import { AddJudgeDto } from '../../src/competition/dto/in/body/add-judge.dto';
import { AddChiefRouteSetterDto } from '../../src/competition/dto/in/body/add-chief-route-setter.dto';
import { AddRouteSetterDto } from '../../src/competition/dto/in/body/add-route-setter.dto';
import { AddTechnicalDelegateDto } from '../../src/competition/dto/in/body/add-technical-delegate.dto';
import { NestExpressApplication } from '@nestjs/platform-express';
import { CompetitionDto } from '../../src/competition/dto/out/competition.dto';
import { CompetitionRegistrationDto } from '../../src/competition/dto/out/competition-registration.dto';

describe('Competition (e2e)', () => {
  let app: NestExpressApplication;
  let competitionService: CompetitionService;
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
    competitionService = moduleFixture.get<CompetitionService>(
      CompetitionService,
    );
    configService = moduleFixture.get<ConfigurationService>(
      ConfigurationService,
    );
    api = supertest(app.getHttpServer());
    utils = new TestUtils(api);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /competitions', () => {
    it('retrieves competitions', async function () {
      const user = await utils.givenUser();
      const token = await utils.login(user);
      const competition = await utils.givenCompetition(token);

      return api
        .get('/api/competitions')
        .send(competition)
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
      const user = await utils.givenUser();
      const token = await utils.login(user);
      const competition = utils.givenCompetitionData();

      return api
        .post('/api/competitions')
        .set('Authorization', `Bearer ${token.token}`)
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
    describe('POST /competitions/{competitionId}/registrations', () => {
      it('creates a registrations', async function () {
        const user = await utils.givenUser();
        const auth = await utils.login(user);
        const competition = await utils.givenCompetition(auth);

        const dto: CreateCompetitionRegistrationDto = {
          userId: user.id,
        };

        await api
          .post(`/api/competitions/${competition.id}/registrations`)
          .set('Authorization', `Bearer ${auth.token}`)
          .send(dto)
          .expect(204);

        const registrations = await utils.getRegistrations(competition);
        const registration = registrations.find(
          (r) => r.competitionId === competition.id && r.userId === user.id,
        );

        expect(registration).toBeTruthy();
      });

      it('returns 401 when unauthenticated user do not own the accessed user', async () => {
        await api.post('/api/competitions/999999/registrations').expect(401);
      });

      it('returns 403 when authenticated user do not own the accessed user', async () => {
        const user = await utils.givenUser();
        const auth = await utils.login(user);

        await api
          .post('/api/competitions/999999999/registrations')
          .set('Authorization', 'Bearer ' + auth.token)
          .expect(403);
      });

      it('returns 404 when getting an unknown registration', async () => {
        const user = await utils.givenAdminUser();
        const auth = await utils.login(user);

        await api
          .post('/api/competitions/999999999/registrations')
          .set('Authorization', 'Bearer ' + auth.token)
          .expect(404);
      });

      it('allows admin to create a registration for a user', async () => {
        const user = await utils.givenUser();
        const admin = await utils.givenAdminUser();
        const auth = await utils.login(admin);
        const competition = await utils.givenCompetition(auth);

        const dto: CreateCompetitionRegistrationDto = {
          userId: user.id,
        };

        await api
          .post('/api/competitions/' + competition.id + '/registrations')
          .set('Authorization', 'Bearer ' + auth.token)
          .send(dto)
          .expect(204);

        const registrations = await utils.getRegistrations(competition);
        const registration = registrations.find(
          (r) => r.competitionId === competition.id && r.userId === user.id,
        );

        expect(registration).toBeTruthy();
      });
    });

    describe('GET /competitions/{competitionId}/registrations', () => {
      it('gets registrations', async function () {
        const user = await utils.givenUser();
        const token = await utils.login(user);
        const competition = await utils.givenCompetition(token);
        await utils.registerUserInCompetition(user, token, competition);

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
        const user = await utils.givenUser();
        const token = await utils.login(user);
        const competition = await utils.givenCompetition(token);
        await utils.registerUserInCompetition(user, token, competition);

        await api
          .delete(
            `/api/competitions/${competition.id}/registrations/${user.id}`,
          )
          .set('Authorization', `Bearer ${token.token}`)
          .expect(204);

        const registrations = await utils.getRegistrations(competition);

        const registration = registrations.find(
          (r) => r.userId === user.id && r.competitionId === competition.id,
        );

        expect(registration).toBeUndefined();
      });
    });
  });

  describe('Jury presidents', function () {
    describe('POST /competitions/{competitionId}/jury-presidents', () => {
      it('adds a jury president', async function () {
        const user = await utils.givenUser();
        const token = await utils.login(user);
        const competition = await utils.givenCompetition(token);

        const dto: AddJuryPresidentDto = {
          userId: user.id,
        };

        await api
          .post(`/api/competitions/${competition.id}/jury-presidents`)
          .set('Authorization', `Bearer ${token.token}`)
          .send(dto)
          .expect(204);

        const juryPresidents = await utils.getJuryPresidents(competition);
        const juryPresident = juryPresidents.find((jp) => jp.id === user.id);
        expect(juryPresident).toBeTruthy();
      });
    });

    describe('GET /competitions/{competitionId}/jury-presidents', () => {
      it('retrieves jury presidents', async function () {
        const user = await utils.givenUser();
        const token = await utils.login(user);
        const competition = await utils.givenCompetition(token);
        await utils.addJuryPresidentInCompetition(user, token, competition);

        const res = await api
          .get(`/api/competitions/${competition.id}/jury-presidents`)
          .expect(200);

        const juryPresident = res.body.find(
          (r: CompetitionDto) => r.id === user.id,
        );

        expect(juryPresident).toBeTruthy();
      });
    });

    describe('DELETE /competitions/{competitionId}/jury-presidents/{userId}', () => {
      it('deletes a jury president', async function () {
        const user = await utils.givenUser();
        const token = await utils.login(user);
        const competition = await utils.givenCompetition(token);
        await utils.addJuryPresidentInCompetition(user, token, competition);

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
    });
  });

  describe('Judges', function () {
    describe('POST /competitions/{competitionId}/judges', () => {
      it('adds a juge', async function () {
        const user = await utils.givenUser();
        const token = await utils.login(user);
        const competition = await utils.givenCompetition(token);

        const dto: AddJudgeDto = {
          userId: user.id,
        };

        await api
          .post(`/api/competitions/${competition.id}/judges`)
          .set('Authorization', `Bearer ${token.token}`)
          .send(dto)
          .expect(204);

        const judges = await utils.getJudges(competition);
        const judge = judges.find((j) => j.id === user.id);
        expect(judge).toBeTruthy();
      });
    });

    describe('GET /competitions/{competitionId}/judges', () => {
      it('retrieves judges', async function () {
        const user = await utils.givenUser();
        const token = await utils.login(user);
        const competition = await utils.givenCompetition(token);
        await utils.addJudgeInCompetition(user, token, competition);

        const res = await api
          .get(`/api/competitions/${competition.id}/judges`)
          .expect(200);

        const judge = res.body.find((r: CompetitionDto) => r.id === user.id);
        expect(judge).toBeTruthy();
      });
    });

    describe('DELETE /competitions/{competitionId}/judges/{userId}', () => {
      it('removes a judge', async function () {
        const user = await utils.givenUser();
        const token = await utils.login(user);
        const competition = await utils.givenCompetition(token);
        await utils.addJudgeInCompetition(user, token, competition);

        await api
          .delete(`/api/competitions/${competition.id}/judges/${user.id}`)
          .set('Authorization', `Bearer ${token.token}`)
          .expect(204);

        const judges = await utils.getJudges(competition);
        const judge = judges.find((r) => r.id === user.id);
        expect(judge).toBeUndefined();
      });
    });
  });

  describe('Chief route setters', function () {
    describe('POST /competitions/{competitionId}/chief-route-setters', () => {
      it('adds a chief route setter', async function () {
        const user = await utils.givenUser();
        const token = await utils.login(user);
        const competition = await utils.givenCompetition(token);

        const dto: AddChiefRouteSetterDto = {
          userId: user.id,
        };

        await api
          .post(`/api/competitions/${competition.id}/chief-route-setters`)
          .set('Authorization', `Bearer ${token.token}`)
          .send(dto)
          .expect(204);

        const chiefRouteSetters = await utils.getChiefRouteSetters(competition);
        const chiefRouteSetter = chiefRouteSetters.find(
          (j) => j.id === user.id,
        );

        expect(chiefRouteSetter).toBeTruthy();
      });
    });

    describe('GET /competitions/{competitionId}/chief-route-setters', () => {
      it('retrieves chief route setters', async function () {
        const user = await utils.givenUser();
        const token = await utils.login(user);
        const competition = await utils.givenCompetition(token);
        await utils.addChiefRouteSetterInCompetition(user, token, competition);

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
      it('removes cheif route setter', async function () {
        const user = await utils.givenUser();
        const token = await utils.login(user);
        const competition = await utils.givenCompetition(token);
        await utils.addChiefRouteSetterInCompetition(user, token, competition);

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
    });
  });

  describe('Route setters', function () {
    describe('POST /competitions/{competitionId}/route-setters', () => {
      it('adds route setter', async function () {
        const user = await utils.givenUser();
        const token = await utils.login(user);
        const competition = await utils.givenCompetition(token);

        const dto: AddRouteSetterDto = {
          userId: user.id,
        };

        await api
          .post(`/api/competitions/${competition.id}/route-setters`)
          .set('Authorization', `Bearer ${token.token}`)
          .send(dto)
          .expect(204);

        const routeSetters = await utils.getRouteSetters(competition);
        const routeSetter = routeSetters.find((j) => j.id === user.id);
        expect(routeSetter).toBeTruthy();
      });
    });

    describe('GET /competitions/{competitionId}/route-setters', () => {
      it('retrieves route setters', async function () {
        const user = await utils.givenUser();
        const token = await utils.login(user);
        const competition = await utils.givenCompetition(token);
        await utils.addRouteSetterInCompetition(user, token, competition);

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
        const user = await utils.givenUser();
        const token = await utils.login(user);
        const competition = await utils.givenCompetition(token);
        await utils.addRouteSetterInCompetition(user, token, competition);

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
    });
  });

  describe('Technical delegates', function () {
    describe('POST /competitions/{competitionId}/technical-delegates', () => {
      it('adds a technical delegate', async function () {
        const user = await utils.givenUser();
        const token = await utils.login(user);
        const competition = await utils.givenCompetition(token);

        const dto: AddTechnicalDelegateDto = {
          userId: user.id,
        };

        await api
          .post(`/api/competitions/${competition.id}/technical-delegates`)
          .set('Authorization', `Bearer ${token.token}`)
          .send(dto)
          .expect(204);

        const technicalDelegates = await utils.getTechnicalDelegates(
          competition,
        );

        const technicalDelegate = technicalDelegates.find(
          (j) => j.id === user.id,
        );

        expect(technicalDelegate).toBeTruthy();
      });
    });

    describe('GET /competitions/{competitionId}/technical-delegates', () => {
      it('retrieves technical delegates', async function () {
        const user = await utils.givenUser();
        const token = await utils.login(user);
        const competition = await utils.givenCompetition(token);
        await utils.addTechnicalDelegateInCompetition(user, token, competition);

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
        const user = await utils.givenUser();
        const token = await utils.login(user);
        const competition = await utils.givenCompetition(token);
        await utils.addTechnicalDelegateInCompetition(user, token, competition);

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
    });
  });
});
