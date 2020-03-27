import * as supertest from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { INestApplication } from '@nestjs/common';
import { configure } from '../../src/app.configuration';
import TestUtils from './utils';
import { ConfigurationService } from '../../src/shared/configuration/configuration.service';
import { CompetitionService } from '../../src/competition/competition.service';

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
});
