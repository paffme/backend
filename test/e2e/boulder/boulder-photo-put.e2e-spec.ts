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
import { existsSync, promises as fs } from 'fs';
import { ConfigurationService } from '../../../src/shared/configuration/configuration.service';

describe('Boulder photo PUT (e2e)', () => {
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

  describe('PUT /competitions/{competitionId}/bouldering-rounds/{roundId}/groups/{groupId}/boulders/{boulderId}/photo', () => {
    it('uploads a boulder photo', async () => {
      const { competition, round, boulder } = await utils.givenReadyCompetition(
        BoulderingRoundRankingType.CIRCUIT,
      );

      const {
        user: juryPresident,
        credentials: juryPresidentCredentials,
      } = await utils.givenUser();

      const presidentJuryAuth = await utils.login(juryPresidentCredentials);
      await utils.addJuryPresidentInCompetition(juryPresident, competition);

      await api
        .put(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}/boulders/${boulder.id}/photo`,
        )
        .set('Authorization', `Bearer ${presidentJuryAuth.token}`)
        .attach('photo', boulderPhoto)
        .expect(204);

      expect(
        existsSync(
          `${configurationService.get('BOULDER_STORAGE_PATH')}/${
            boulder.id
          }.jpg`,
        ),
      ).toEqual(true);

      expect(
        (
          await fs.readFile(
            `${configurationService.get('BOULDER_STORAGE_PATH')}/${
              boulder.id
            }.jpg`,
          )
        ).toString(),
      ).toEqual((await fs.readFile(boulderPhoto)).toString());
    });

    it('throws 401 when trying to upload a photo without auth', async () => {
      const { competition, round, boulder } = await utils.givenReadyCompetition(
        BoulderingRoundRankingType.CIRCUIT,
      );

      await api
        .put(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}/boulders/${boulder.id}/photo`,
        )
        .attach('photo', boulderPhoto)
        .expect(401);
    });

    it('throws 403 when trying to upload a photo without having the appropriate role', async () => {
      const { competition, round, boulder } = await utils.givenReadyCompetition(
        BoulderingRoundRankingType.CIRCUIT,
      );

      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);

      await api
        .put(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}/boulders/${boulder.id}/photo`,
        )
        .set('Authorization', `Bearer ${auth.token}`)
        .attach('photo', boulderPhoto)
        .expect(403);
    });
  });
});
