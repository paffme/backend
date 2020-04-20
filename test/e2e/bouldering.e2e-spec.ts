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
} from '../../src/bouldering/round/bouldering-round.entity';
import { CreateBoulderingRoundDto } from '../../src/competition/dto/in/body/create-bouldering-round.dto';
import { CreateBoulderingResultDto } from '../../src/competition/dto/in/body/create-bouldering-result.dto';
import { User } from '../../src/user/user.entity';
import { TokenResponseDto } from '../../src/user/dto/out/token-response.dto';
import { Boulder } from '../../src/bouldering/boulder/boulder.entity';
import { Competition } from '../../src/competition/competition.entity';
import { RankingDto } from '../../src/competition/dto/out/ranking.dto';
import { CompetitionType } from '../../src/competition/types/competition-type.enum';

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
    const competition = await utils.givenCompetition(organizer, {
      type: CompetitionType.Bouldering,
    });
    await utils.registerUserInCompetition(climber, competition);
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

  describe('POST /competitions/{competitionId}/bouldering-rounds/{roundId}/boulders/:boulderId/results', () => {
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

    it('adds a bouldering result by a jury president', async function () {
      const {
        climber,
        competition,
        round,
        boulder,
      } = await givenReadyCompetition(BoulderingRoundRankingType.CIRCUIT);

      const {
        user: juryPresident,
        credentials: juryPresidentCredentials,
      } = await utils.givenUser();

      const presidentJuryAuth = await utils.login(juryPresidentCredentials);
      await utils.addJuryPresidentInCompetition(juryPresident, competition);

      const dto: CreateBoulderingResultDto = {
        top: true,
        climberId: climber.id,
      };

      await api
        .post(
          `/api/competitions/${competition.id}/bouldering-rounds/${round.id}/boulders/${boulder.id}/results`,
        )
        .set('Authorization', `Bearer ${presidentJuryAuth.token}`)
        .send(dto)
        .expect(201);
    });

    it('does not allow to add an empty result', async function () {
      const {
        climber,
        competition,
        round,
        boulder,
        judgeAuth,
      } = await givenReadyCompetition(BoulderingRoundRankingType.CIRCUIT);

      const dto: CreateBoulderingResultDto = {
        climberId: climber.id,
      };

      const { body } = await api
        .post(
          `/api/competitions/${competition.id}/bouldering-rounds/${round.id}/boulders/${boulder.id}/results`,
        )
        .set('Authorization', `Bearer ${judgeAuth.token}`)
        .send(dto)
        .expect(422);

      expect(body.message).toEqual(
        'At least one element in the body is required among try, zone and top',
      );
    });

    it('does not allow a non jury user to add a result', async () => {
      const {
        climber,
        competition,
        round,
        boulder,
      } = await givenReadyCompetition(BoulderingRoundRankingType.CIRCUIT);

      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);

      const dto: CreateBoulderingResultDto = {
        top: true,
        climberId: climber.id,
      };

      return api
        .post(
          `/api/competitions/${competition.id}/bouldering-rounds/${round.id}/boulders/${boulder.id}/results`,
        )
        .set('Authorization', `Bearer ${auth.token}`)
        .send(dto)
        .expect(403);
    });

    it('does not allow a non authenticated user to add a result', async () => {
      const {
        climber,
        competition,
        round,
        boulder,
      } = await givenReadyCompetition(BoulderingRoundRankingType.CIRCUIT);

      const dto: CreateBoulderingResultDto = {
        top: true,
        climberId: climber.id,
      };

      return api
        .post(
          `/api/competitions/${competition.id}/bouldering-rounds/${round.id}/boulders/${boulder.id}/results`,
        )
        .send(dto)
        .expect(401);
    });
  });

  describe('GET /api/competitions/{competitionId}/rankings', () => {
    it('gets the competition ranking', async () => {
      const {
        climber,
        competition,
        round,
        boulder,
      } = await givenReadyCompetition(BoulderingRoundRankingType.CIRCUIT);

      await utils.addBoulderingResult(competition, round, boulder, climber);

      const res = await api
        .get(`/api/competitions/${competition.id}/rankings`)
        .expect(200);

      const body: RankingDto[] = res.body;

      expect(body).toHaveLength(1);
      expect(body[0].ranking).toEqual(1);
      expect(body[0].climber.id).toEqual(climber.id);
      expect(body[0].climber.club).toEqual(null);
      expect(body[0].climber.firstName).toEqual(climber.firstName);
      expect(body[0].climber.lastName).toEqual(climber.lastName);
    });
  });
});
