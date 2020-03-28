import supertest from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { INestApplication } from '@nestjs/common';
import { configure } from '../../src/app.configuration';
import TestUtils from './utils';
import { ConfigurationService } from '../../src/shared/configuration/configuration.service';
import { CompetitionService } from '../../src/competition/competition.service';
import { CreateCompetitionRegistrationDto } from '../../src/competition/dto/create-competition-registration.dto';

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

  it('POST /competitions/{competitionId}/registrations', async function () {
    const user = await utils.givenUser();
    const token = await utils.login(user);
    const competition = await utils.givenCompetition(token);

    const dto: CreateCompetitionRegistrationDto = {
      userId: user.id,
    };

    return api
      .post(`/api/competitions/${competition.id}/registrations`)
      .set('Authorization', `Bearer ${token.token}`)
      .send(dto)
      .expect(204);
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
});
