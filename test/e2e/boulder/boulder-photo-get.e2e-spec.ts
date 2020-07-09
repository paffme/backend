import supertest from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';
import { configure } from '../../../src/app.configuration';
import TestUtils from '../../utils';
import { NestExpressApplication } from '@nestjs/platform-express';
import { UserService } from '../../../src/user/user.service';
import { CompetitionService } from '../../../src/competition/competition.service';
import { BoulderingRoundRankingType } from '../../../src/bouldering/round/bouldering-round.entity';
import { BoulderService } from '../../../src/bouldering/boulder/boulder.service';
import * as path from 'path';
import { promises as fs } from 'fs';
import { ConfigurationService } from '../../../src/shared/configuration/configuration.service';
import { BoulderHasNoPhotoError } from '../../../src/competition/errors/boulder-has-no-photo.error';

describe('Boulder photo GET (e2e)', () => {
  let app: NestExpressApplication;
  let utils: TestUtils;
  let api: supertest.SuperTest<supertest.Test>;
  let configurationService: ConfigurationService;

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

    configurationService = new ConfigurationService();
  });

  beforeEach(() => {
    utils.clearORM();
  });

  afterAll(async () => {
    await app.close();
  });

  const boulderPhoto = path.resolve(
    __dirname,
    '../../assets/boulder_photo.jpg',
  );

  describe('GET /competitions/{competitionId}/bouldering-rounds/{roundId}/groups/{groupId}/boulders/{boulderId}/photo', () => {
    it('throws 404 if boulder has no photo', async () => {
      const { competition, round, boulder } = await utils.givenReadyCompetition(
        BoulderingRoundRankingType.CIRCUIT,
      );

      const { body } = await api
        .get(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}/boulders/${boulder.id}/photo`,
        )
        .expect(404);

      expect(body.code).toEqual(new BoulderHasNoPhotoError().code);
    });

    it('gets url', async () => {
      const { competition, round, boulder } = await utils.givenReadyCompetition(
        BoulderingRoundRankingType.CIRCUIT,
      );

      await utils.addBoulderPhoto(
        boulder,
        await fs.readFile(boulderPhoto),
        'jpg',
      );

      const res = await api
        .get(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}/boulders/${boulder.id}/photo`,
        )
        .expect(200);

      expect(res.body.url).toEqual(
        `${configurationService.get('BOULDER_STORAGE_URL')}/${boulder.id}.jpg`,
      );

      expect(res.body.width).toEqual(670);
      expect(res.body.height).toEqual(475);
    });
  });
});
