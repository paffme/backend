import supertest from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { INestApplication } from '@nestjs/common';
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

describe('Competition (e2e)', () => {
  let app: INestApplication;
  let competitionService: CompetitionService;
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

  it('GET /competitions', async function () {
    const user = await utils.givenUser();
    const token = await utils.login(user);
    const competition = await utils.givenCompetition(token);

    return api
      .get('/api/competitions')
      .send(competition)
      .expect(200)
      .then((res) => {
        expect(res.body.map((c) => c.id)).toContain(competition.id);
      });
  });

  it('POST /competitions', async function () {
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

  describe('Registrations', function () {
    it('POST /competitions/{competitionId}/registrations', async function () {
      const user = await utils.givenUser();
      const token = await utils.login(user);
      const competition = await utils.givenCompetition(token);

      const dto: CreateCompetitionRegistrationDto = {
        userId: user.id,
      };

      await api
        .post(`/api/competitions/${competition.id}/registrations`)
        .set('Authorization', `Bearer ${token.token}`)
        .send(dto)
        .expect(204);

      const registrations = await utils.getRegistrations(competition);
      const registration = registrations.find(
        (r) => r.competitionId === competition.id && r.userId === user.id,
      );

      expect(registration).toBeTruthy();
    });

    it('GET /competitions/{competitionId}/registrations', async function () {
      const user = await utils.givenUser();
      const token = await utils.login(user);
      const competition = await utils.givenCompetition(token);
      await utils.registerUserInCompetition(user, token, competition);

      const res = await api
        .get(`/api/competitions/${competition.id}/registrations`)
        .expect(200);

      const registration = res.body.find(
        (r) => r.userId === user.id && r.competitionId === competition.id,
      );

      expect(registration).toBeTruthy();
      expect(registration).toHaveProperty('createdAt');
      expect(registration).toHaveProperty('updatedAt');
    });

    it('DELETE /competitions/{competitionId}/registrations/{userId}', async function () {
      const user = await utils.givenUser();
      const token = await utils.login(user);
      const competition = await utils.givenCompetition(token);
      await utils.registerUserInCompetition(user, token, competition);

      await api
        .delete(`/api/competitions/${competition.id}/registrations/${user.id}`)
        .set('Authorization', `Bearer ${token.token}`)
        .expect(204);

      const registrations = await utils.getRegistrations(competition);

      const registration = registrations.find(
        (r) => r.userId === user.id && r.competitionId === competition.id,
      );

      expect(registration).toBeUndefined();
    });
  });

  describe('Jury presidents', function () {
    it('POST /competitions/{competitionId}/jury-presidents', async function () {
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

    it('GET /competitions/{competitionId}/jury-presidents', async function () {
      const user = await utils.givenUser();
      const token = await utils.login(user);
      const competition = await utils.givenCompetition(token);
      await utils.addJuryPresidentInCompetition(user, token, competition);

      const res = await api
        .get(`/api/competitions/${competition.id}/jury-presidents`)
        .expect(200);

      const juryPresident = res.body.find((r) => r.id === user.id);
      expect(juryPresident).toBeTruthy();
    });

    it('DELETE /competitions/{competitionId}/jury-presidents/{userId}', async function () {
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

  describe('Judges', function () {
    it('POST /competitions/{competitionId}/judges', async function () {
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

    it('GET /competitions/{competitionId}/judges', async function () {
      const user = await utils.givenUser();
      const token = await utils.login(user);
      const competition = await utils.givenCompetition(token);
      await utils.addJudgeInCompetition(user, token, competition);

      const res = await api
        .get(`/api/competitions/${competition.id}/judges`)
        .expect(200);

      const judge = res.body.find((r) => r.id === user.id);
      expect(judge).toBeTruthy();
    });

    it('DELETE /competitions/{competitionId}/judges/{userId}', async function () {
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

  describe('Chief route setters', function () {
    it('POST /competitions/{competitionId}/chief-route-setters', async function () {
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
      const chiefRouteSetter = chiefRouteSetters.find((j) => j.id === user.id);
      expect(chiefRouteSetter).toBeTruthy();
    });

    it('GET /competitions/{competitionId}/chief-route-setters', async function () {
      const user = await utils.givenUser();
      const token = await utils.login(user);
      const competition = await utils.givenCompetition(token);
      await utils.addChiefRouteSetterInCompetition(user, token, competition);

      const res = await api
        .get(`/api/competitions/${competition.id}/chief-route-setters`)
        .expect(200);

      const chiefRouteSetter = res.body.find((r) => r.id === user.id);
      expect(chiefRouteSetter).toBeTruthy();
    });

    it('DELETE /competitions/{competitionId}/chief-route-setters/{userId}', async function () {
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
      const chiefRouteSetter = chiefRouteSetters.find((r) => r.id === user.id);
      expect(chiefRouteSetter).toBeUndefined();
    });
  });

  describe('Route setters', function () {
    it('POST /competitions/{competitionId}/route-setters', async function () {
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

    it('GET /competitions/{competitionId}/route-setters', async function () {
      const user = await utils.givenUser();
      const token = await utils.login(user);
      const competition = await utils.givenCompetition(token);
      await utils.addRouteSetterInCompetition(user, token, competition);

      const res = await api
        .get(`/api/competitions/${competition.id}/route-setters`)
        .expect(200);

      const routeSetter = res.body.find((r) => r.id === user.id);
      expect(routeSetter).toBeTruthy();
    });

    it('DELETE /competitions/{competitionId}/route-setters/{userId}', async function () {
      const user = await utils.givenUser();
      const token = await utils.login(user);
      const competition = await utils.givenCompetition(token);
      await utils.addRouteSetterInCompetition(user, token, competition);

      await api
        .delete(`/api/competitions/${competition.id}/route-setters/${user.id}`)
        .set('Authorization', `Bearer ${token.token}`)
        .expect(204);

      const routeSetters = await utils.getRouteSetters(competition);
      const routeSetter = routeSetters.find((r) => r.id === user.id);
      expect(routeSetter).toBeUndefined();
    });
  });

  describe('Technical delegates', function () {
    it('POST /competitions/{competitionId}/technical-delegates', async function () {
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

      const technicalDelegates = await utils.getTechnicalDelegates(competition);
      const technicalDelegate = technicalDelegates.find(
        (j) => j.id === user.id,
      );
      expect(technicalDelegate).toBeTruthy();
    });

    it('GET /competitions/{competitionId}/technical-delegates', async function () {
      const user = await utils.givenUser();
      const token = await utils.login(user);
      const competition = await utils.givenCompetition(token);
      await utils.addTechnicalDelegateInCompetition(user, token, competition);

      const res = await api
        .get(`/api/competitions/${competition.id}/technical-delegates`)
        .expect(200);

      const technicalDelegate = res.body.find((r) => r.id === user.id);
      expect(technicalDelegate).toBeTruthy();
    });

    it('DELETE /competitions/{competitionId}/technical-delegates/{userId}', async function () {
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

      const technicalDelegates = await utils.getTechnicalDelegates(competition);
      const technicalDelegate = technicalDelegates.find(
        (r) => r.id === user.id,
      );

      expect(technicalDelegate).toBeUndefined();
    });
  });
});
