import supertest from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { configure } from '../../src/app.configuration';
import TestUtils from '../utils';
import { NestExpressApplication } from '@nestjs/platform-express';
import { UserService } from '../../src/user/user.service';
import { CompetitionService } from '../../src/competition/competition.service';
import {
  BoulderingRound,
  BoulderingRoundRankingType,
  BoulderingRoundType,
} from '../../src/bouldering/bouldering-round.entity';
import { CreateBoulderingRoundDto } from '../../src/competition/dto/in/body/create-bouldering-round.dto';
import { CreateBoulderingResultDto } from '../../src/competition/dto/in/body/create-bouldering-result.dto';
import { User } from '../../src/user/user.entity';
import { TokenResponseDto } from '../../src/user/dto/out/token-response.dto';
import { Boulder } from '../../src/bouldering/boulder.entity';
import { Competition } from '../../src/competition/competition.entity';

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
      const competition = await utils.givenCompetition(user);
      await utils.addJuryPresidentInCompetition(user, competition);
      utils.clearORM();

      const dto: CreateBoulderingRoundDto = {
        index: 0,
        boulders: 5,
        name: 'Super Round',
        quota: 0,
        rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
        type: BoulderingRoundType.QUALIFIER,
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
      expect(body.boulders).toHaveLength(dto.boulders);
      expect(body.index).toEqual(dto.index);
      expect(body.competitionId).toEqual(competition.id);

      for (let i = 0; i < dto.boulders; i++) {
        expect(body.boulders[i].index).toEqual(i);
        expect(body.boulders[i]).toHaveProperty('id');
      }
    });
  });

  describe('POST /competitions/{competitionId}/bouldering-rounds/{roundId}/boulders/:boulderId/results/{userId}', () => {
    async function givenReadyCompetition(
      rankingType: BoulderingRoundRankingType,
    ): Promise<{
      competition: Competition;
      organizer: User;
      climber: User;
      judge: User;
      judgeAuth: TokenResponseDto;
      boulder: Boulder;
      round: BoulderingRound;
    }> {
      const { user: organizer } = await utils.givenUser();
      const { user: climber } = await utils.givenUser();

      const {
        user: judge,
        credentials: judgeCredentials,
      } = await utils.givenUser();

      const judgeAuth = await utils.login(judgeCredentials);
      const competition = await utils.givenCompetition(organizer);
      await utils.addJudgeInCompetition(judge, competition);

      const round = await utils.addBoulderingRound(competition, {
        rankingType,
        type: BoulderingRoundType.QUALIFIER,
        boulders: 1,
      });

      const boulder = round.boulders.getItems()[0];
      utils.clearORM();

      return {
        competition,
        organizer,
        climber,
        judge,
        judgeAuth,
        boulder,
        round,
      };
    }

    it('adds a bouldering result for an unlimited contest', async function () {
      const {
        climber,
        competition,
        round,
        boulder,
        judgeAuth,
      } = await givenReadyCompetition(
        BoulderingRoundRankingType.UNLIMITED_CONTEST,
      );

      const dto: CreateBoulderingResultDto = {
        top: true,
        climberId: climber.id,
      };

      const { body } = await api
        .post(
          `/api/competitions/${competition.id}/bouldering-rounds/${round.id}/boulders/${boulder.id}/results`,
        )
        .set('Authorization', `Bearer ${judgeAuth.token}`)
        .send(dto)
        .expect(201);

      expect(body).toHaveProperty('id');
      expect(body.climberId).toEqual(climber.id);
      expect(body.competitionId).toEqual(competition.id);
      expect(body.roundId).toEqual(round.id);
      expect(body.boulderId).toEqual(boulder.id);
      expect(body.top).toEqual(true);
      expect(body.topInTries).toBeUndefined();
      expect(body.zone).toBeUndefined();
      expect(body.zoneInTries).toBeUndefined();
      expect(body.tries).toBeUndefined();
    });

    it('adds a bouldering result for a limited contest', async function () {
      const {
        climber,
        competition,
        round,
        boulder,
        judgeAuth,
      } = await givenReadyCompetition(
        BoulderingRoundRankingType.LIMITED_CONTEST,
      );

      const dto: CreateBoulderingResultDto = {
        top: true,
        zone: true,
        try: true,
        climberId: climber.id,
      };

      const { body } = await api
        .post(
          `/api/competitions/${competition.id}/bouldering-rounds/${round.id}/boulders/${boulder.id}/results`,
        )
        .set('Authorization', `Bearer ${judgeAuth.token}`)
        .send(dto)
        .expect(201);

      expect(body).toHaveProperty('id');
      expect(body.climberId).toEqual(climber.id);
      expect(body.competitionId).toEqual(competition.id);
      expect(body.roundId).toEqual(round.id);
      expect(body.boulderId).toEqual(boulder.id);
      expect(body.top).toEqual(true);
      expect(body.topInTries).toEqual(1);
      expect(body.zone).toEqual(true);
      expect(body.zoneInTries).toEqual(1);
      expect(body.tries).toEqual(1);
    });

    it('adds a bouldering result for a circuit', async function () {
      const {
        climber,
        competition,
        round,
        boulder,
        judgeAuth,
      } = await givenReadyCompetition(BoulderingRoundRankingType.CIRCUIT);

      const dto: CreateBoulderingResultDto = {
        top: true,
        zone: true,
        try: true,
        climberId: climber.id,
      };

      const { body } = await api
        .post(
          `/api/competitions/${competition.id}/bouldering-rounds/${round.id}/boulders/${boulder.id}/results`,
        )
        .set('Authorization', `Bearer ${judgeAuth.token}`)
        .send(dto)
        .expect(201);

      expect(body).toHaveProperty('id');
      expect(body.climberId).toEqual(climber.id);
      expect(body.competitionId).toEqual(competition.id);
      expect(body.roundId).toEqual(round.id);
      expect(body.boulderId).toEqual(boulder.id);
      expect(body.top).toEqual(true);
      expect(body.topInTries).toEqual(1);
      expect(body.zone).toEqual(true);
      expect(body.zoneInTries).toEqual(1);
      expect(body.tries).toEqual(1);
    });
  });
});