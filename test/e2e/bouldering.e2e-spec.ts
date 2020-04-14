import supertest from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { configure } from '../../src/app.configuration';
import TestUtils from '../utils';
import { NestExpressApplication } from '@nestjs/platform-express';
import { UserService } from '../../src/user/user.service';
import { CompetitionService } from '../../src/competition/competition.service';
import { CreateBoulderingRoundDto } from '../../src/competition/dto/in/body/create-bouldering-round.dto';
import { BoulderingRoundType } from '../../src/bouldering/bouldering-round.entity';

describe('Bouldering (e2e)', () => {
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

  describe('POST /competitions/{competitionId}/bouldering-rounds', () => {
    it('adds a bouldering round', async function () {
      const { user, credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);
      let competition = await utils.givenCompetition(user);
      await utils.addJuryPresidentInCompetition(user, competition);
      utils.clearORM();

      const dto: CreateBoulderingRoundDto = {
        index: 0,
        boulders: 5,
        name: 'Super Round',
        quota: 0,
        type: BoulderingRoundType.UNLIMITED_CONTEST,
      };

      const { body } = await api
        .post(`/api/competitions/${competition.id}/bouldering-rounds`)
        .set('Authorization', `Bearer ${auth.token}`)
        .send(dto)
        .expect(201);

      expect(body).toHaveProperty('id');
      expect(body.name).toEqual(dto.name);
      expect(body.type).toEqual(dto.type);
      expect(body.quota).toEqual(dto.quota);
      expect(body.boulders).toEqual(dto.boulders);
      expect(body.index).toEqual(dto.index);
      expect(body.competition).toEqual(competition.id);

      competition = await utils.getCompetition(competition.id, [
        'boulderingRounds',
      ]);

      expect(competition.boulderingRounds.getItems()[0].id).toEqual(body.id);
    });
  });
});
