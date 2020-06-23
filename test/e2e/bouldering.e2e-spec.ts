import supertest from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { configure } from '../../src/app.configuration';
import TestUtils from '../utils';
import { NestExpressApplication } from '@nestjs/platform-express';
import { UserService } from '../../src/user/user.service';
import { CompetitionService } from '../../src/competition/competition.service';
import {
  BoulderingRoundRankingType,
  BoulderingRoundState,
} from '../../src/bouldering/round/bouldering-round.entity';
import { CreateBoulderingRoundDto } from '../../src/competition/dto/in/body/create-bouldering-round.dto';
import { CreateBoulderingResultDto } from '../../src/competition/dto/in/body/create-bouldering-result.dto';
import { RankingsDto } from '../../src/competition/dto/out/rankings.dto';
import { Sex } from '../../src/shared/types/sex.enum';
import { CategoryName } from '../../src/shared/types/category-name.enum';
import { CreateBoulderDto } from '../../src/competition/dto/in/body/create-boulder.dto';
import { BoulderingRoundRankingsDto } from '../../src/bouldering/dto/out/bouldering-round-rankings.dto';
import { CreateBoulderingGroupDto } from '../../src/competition/dto/in/body/create-bouldering-group.dto';
import { CompetitionRoundType } from '../../src/competition/competition-round-type.enum';
import { UpdateBoulderingRoundDto } from '../../src/competition/dto/in/body/update-bouldering-round.dto';
import * as uuid from 'uuid';
import { BoulderService } from '../../src/bouldering/boulder/boulder.service';
import { BoulderingGroupState } from '../../src/bouldering/group/bouldering-group.entity';
import { BulkBoulderingResultsDto } from '../../src/competition/dto/in/body/bulk-bouldering-results.dto';
import { MaxTriesReachedError } from '../../src/bouldering/errors/max-tries-reached.error';
import { BoulderingCircuitRankingDto } from '../../src/bouldering/dto/out/bouldering-circuit-ranking.dto';
import {
  BoulderingGroupRankingsDto,
  CircuitGroupRankingsDto,
} from '../../src/bouldering/dto/out/bouldering-group-rankings.dto';

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
      moduleFixture.get(BoulderService),
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
        boulders: 5,
        name: 'Super Round',
        rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
        type: CompetitionRoundType.QUALIFIER,
        sex: Sex.Female,
        category: CategoryName.Minime,
        maxTries: 5,
      };

      const { body } = await api
        .post(`/competitions/${competition.id}/bouldering-rounds`)
        .set('Authorization', `Bearer ${auth.token}`)
        .send(dto)
        .expect(201);

      expect(body).toHaveProperty('id');
      expect(body.name).toEqual(dto.name);
      expect(body.type).toEqual(dto.type);
      expect(body.quota).toEqual(3);
      expect(body.maxTries).toEqual(dto.maxTries);
      expect(body.competitionId).toEqual(competition.id);
      expect(body.sex).toEqual(Sex.Female);
      expect(body.category).toEqual(CategoryName.Minime);
      expect(body.groups).toHaveLength(1);
      expect(body.state).toEqual(BoulderingRoundState.PENDING);

      const group = body.groups[0];
      expect(group).toHaveProperty('id');
      expect(group.name).toEqual('0');
      expect(group.roundId).toEqual(body.id);
      expect(group.climbers).toHaveLength(0);
      expect(group.boulders).toHaveLength(dto.boulders);

      for (let i = 0; i < dto.boulders; i++) {
        expect(group.boulders[i]).toHaveProperty('id');
      }
    });

    it('should create a qualifier bouldering round and add already registered climbers', async function () {
      const { user, credentials } = await utils.givenUser();
      const { user: climber } = await utils.givenUser({
        birthYear: 20,
        sex: Sex.Male,
      });
      const auth = await utils.login(credentials);
      const competition = await utils.givenCompetition(user);
      await utils.addJuryPresidentInCompetition(user, competition);
      await utils.registerUserInCompetition(climber, competition);
      utils.clearORM();

      const dto: CreateBoulderingRoundDto = {
        boulders: 1,
        name: 'Youhou',
        rankingType: BoulderingRoundRankingType.CIRCUIT,
        type: CompetitionRoundType.QUALIFIER,
        sex: Sex.Male,
        category: CategoryName.Veteran,
        groups: 1,
        maxTries: 2,
      };

      const { body } = await api
        .post(`/competitions/${competition.id}/bouldering-rounds`)
        .set('Authorization', `Bearer ${auth.token}`)
        .send(dto)
        .expect(201);

      expect(body.groups[0].climbers[0].id).toEqual(climber.id);
      expect(body.groups[0].climbers[0].firstName).toEqual(climber.firstName);
      expect(body.groups[0].climbers[0].lastName).toEqual(climber.lastName);
    });
  });

  describe('POST /competitions/{competitionId}/bouldering-rounds/{roundId}/groups/{groupId}/boulders/:boulderId/results', () => {
    it('does not add a result if the judge is not assigned to the boulder', async () => {
      const {
        climber,
        competition,
        round,
        boulder,
      } = await utils.givenReadyCompetition(
        BoulderingRoundRankingType.UNLIMITED_CONTEST,
      );

      const {
        user: judge,
        credentials: judgeCredentials,
      } = await utils.givenUser();

      const judgeAuth = await utils.login(judgeCredentials);
      await utils.addJudgeInCompetition(judge, competition);

      const dto: CreateBoulderingResultDto = {
        top: true,
        climberId: climber.id,
      };

      await api
        .post(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}/boulders/${boulder.id}/results`,
        )
        .set('Authorization', `Bearer ${judgeAuth.token}`)
        .send(dto)
        .expect(403);
    });

    it('adds a bouldering result for an unlimited contest', async function () {
      const {
        climber,
        competition,
        round,
        boulder,
        judgeAuth,
      } = await utils.givenReadyCompetition(
        BoulderingRoundRankingType.UNLIMITED_CONTEST,
      );

      const dto: CreateBoulderingResultDto = {
        top: true,
        climberId: climber.id,
      };

      const { body } = await api
        .post(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}/boulders/${boulder.id}/results`,
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
      } = await utils.givenReadyCompetition(
        BoulderingRoundRankingType.LIMITED_CONTEST,
        {
          maxTries: 5,
        },
      );

      const dto: CreateBoulderingResultDto = {
        top: true,
        zone: true,
        try: 1,
        climberId: climber.id,
      };

      const { body } = await api
        .post(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}/boulders/${boulder.id}/results`,
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

    it('throws MAX_TRIES_REACHED when adding a bouldering result for a limited contest and exceed the maxTries limit', async function () {
      const {
        climber,
        competition,
        round,
        boulder,
        judgeAuth,
      } = await utils.givenReadyCompetition(
        BoulderingRoundRankingType.LIMITED_CONTEST,
        {
          maxTries: 5,
        },
      );

      const dto: CreateBoulderingResultDto = {
        top: true,
        zone: true,
        try: 6,
        climberId: climber.id,
      };

      const { body } = await api
        .post(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}/boulders/${boulder.id}/results`,
        )
        .set('Authorization', `Bearer ${judgeAuth.token}`)
        .send(dto)
        .expect(422);

      expect(body.code).toEqual(new MaxTriesReachedError().code);
    });

    it('adds a bouldering result for a circuit', async function () {
      const {
        climber,
        competition,
        round,
        boulder,
        judgeAuth,
      } = await utils.givenReadyCompetition(BoulderingRoundRankingType.CIRCUIT);

      const dto: CreateBoulderingResultDto = {
        top: true,
        zone: true,
        try: 1,
        climberId: climber.id,
      };

      const { body } = await api
        .post(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}/boulders/${boulder.id}/results`,
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
      } = await utils.givenReadyCompetition(BoulderingRoundRankingType.CIRCUIT);

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
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}/boulders/${boulder.id}/results`,
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
      } = await utils.givenReadyCompetition(BoulderingRoundRankingType.CIRCUIT);

      const dto: CreateBoulderingResultDto = {
        climberId: climber.id,
      };

      const { body } = await api
        .post(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}/boulders/${boulder.id}/results`,
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
      } = await utils.givenReadyCompetition(BoulderingRoundRankingType.CIRCUIT);

      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);

      const dto: CreateBoulderingResultDto = {
        top: true,
        climberId: climber.id,
      };

      return api
        .post(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}/boulders/${boulder.id}/results`,
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
      } = await utils.givenReadyCompetition(BoulderingRoundRankingType.CIRCUIT);

      const dto: CreateBoulderingResultDto = {
        top: true,
        climberId: climber.id,
      };

      return api
        .post(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}/boulders/${boulder.id}/results`,
        )
        .send(dto)
        .expect(401);
    });
  });

  describe('GET /competitions/{competitionId}/rankings', () => {
    it('gets the competition ranking', async () => {
      const {
        climber,
        competition,
        round,
        boulder,
      } = await utils.givenReadyCompetition(BoulderingRoundRankingType.CIRCUIT);

      await utils.addBoulderingResult(
        competition,
        round,
        round.groups[0],
        boulder,
        climber,
      );

      const res = await api
        .get(`/competitions/${competition.id}/rankings`)
        .expect(200);

      const body: RankingsDto = res.body;
      const category = climber.getCategory(competition.getSeason());

      expect(body).toHaveProperty(category.name);
      expect(body[category.name]).toHaveProperty(category.sex);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const r = body[category.name]![category.sex]![0];
      expect(r.ranking).toEqual(1);
      expect(r.climber.id).toEqual(climber.id);
      expect(r.climber.club).toEqual(climber.club);
      expect(r.climber.firstName).toEqual(climber.firstName);
      expect(r.climber.lastName).toEqual(climber.lastName);
    });
  });

  describe('POST /competitions/{competitionId}/bouldering-rounds/{roundId}/groups/{groupId}/boulders', () => {
    it('adds a boulder', async () => {
      const { competition, round, boulder } = await utils.givenReadyCompetition(
        BoulderingRoundRankingType.CIRCUIT,
      );

      const {
        user: juryPresident,
        credentials: juryPresidentCredentials,
      } = await utils.givenUser();

      const presidentJuryAuth = await utils.login(juryPresidentCredentials);
      await utils.addJuryPresidentInCompetition(juryPresident, competition);

      const dto: CreateBoulderDto = {};

      const { body } = await api
        .post(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}/boulders`,
        )
        .set('Authorization', `Bearer ${presidentJuryAuth.token}`)
        .send(dto)
        .expect(201);

      expect(body).toHaveProperty('id');
      expect(body.judges).toHaveLength(0);

      const group = await utils.getBoulderingGroup(round.groups[0].id);
      const boulders = await group.boulders.loadItems();
      const createdBoulder = boulders.find((b) => b.id === body.id);
      expect(createdBoulder).toBeTruthy();
    });

    it('returns 401 when adding a boulder without being authenticated', async () => {
      const { competition, round } = await utils.givenReadyCompetition(
        BoulderingRoundRankingType.CIRCUIT,
      );

      const dto: CreateBoulderDto = {};

      await api
        .post(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}/boulders`,
        )
        .send(dto)
        .expect(401);
    });

    it('returns 403 when adding a boulder without being a jury president', async () => {
      const { competition, round } = await utils.givenReadyCompetition(
        BoulderingRoundRankingType.CIRCUIT,
      );

      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);
      const dto: CreateBoulderDto = {};

      await api
        .post(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}/boulders`,
        )
        .set('Authorization', `Bearer ${auth.token}`)
        .send(dto)
        .expect(403);
    });
  });

  describe('DELETE /competitions/{competitionId}/bouldering-rounds/{roundId}/groups/{groupId}/boulders/{boulderId}', () => {
    it('deletes a boulder', async () => {
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
        .delete(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}/boulders/${boulder.id}`,
        )
        .set('Authorization', `Bearer ${presidentJuryAuth.token}`)
        .expect(204);

      const group = await utils.getBoulderingGroup(round.groups[0].id);
      const boulders = await group.boulders.loadItems();
      const deletedBoulder = boulders.find((b) => b.id === boulder.id);
      expect(deletedBoulder).toBeUndefined();
    });

    it('returns 401 when deleting a boulder without being authenticated', async () => {
      const { competition, round, boulder } = await utils.givenReadyCompetition(
        BoulderingRoundRankingType.CIRCUIT,
      );

      await api
        .delete(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}/boulders/${boulder.id}`,
        )
        .expect(401);
    });

    it('returns 403 when deleting a boulder without being a jury president', async () => {
      const { competition, round, boulder } = await utils.givenReadyCompetition(
        BoulderingRoundRankingType.CIRCUIT,
      );

      const { credentials } = await utils.givenUser();
      const auth = await utils.login(credentials);

      await api
        .delete(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}/boulders/${boulder.id}`,
        )
        .set('Authorization', `Bearer ${auth.token}`)
        .expect(403);
    });
  });

  describe('GET /competitions/{competitionId}/bouldering-rounds/{roundId}/rankings', () => {
    it('gets round rankings', async () => {
      const {
        climber,
        competition,
        round,
        boulder,
      } = await utils.givenReadyCompetition(BoulderingRoundRankingType.CIRCUIT);

      await utils.addBoulderingResult(
        competition,
        round,
        round.groups[0],
        boulder,
        climber,
        {
          climberId: climber.id,
          try: 1,
          zone: true,
          top: true,
        },
      );

      const res = await api
        .get(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/rankings`,
        )
        .expect(200);

      const body: BoulderingRoundRankingsDto = res.body;

      expect(body.type).toEqual(BoulderingRoundRankingType.CIRCUIT);
      expect(body.data).toHaveLength(1);
      const ranking = body.data[0] as BoulderingCircuitRankingDto;

      expect(ranking.ranking).toEqual(1);
      expect(ranking.climber.id).toEqual(climber.id);
      expect(ranking.climber.club).toEqual(climber.club);
      expect(ranking.climber.firstName).toEqual(climber.firstName);
      expect(ranking.climber.lastName).toEqual(climber.lastName);
      expect(ranking.tops[0]).toEqual(true);
      expect(ranking.topsInTries[0]).toEqual(1);
      expect(ranking.zones[0]).toEqual(true);
      expect(ranking.zonesInTries[0]).toEqual(1);
    });
  });

  describe('GET /competitions/{competitionId}/bouldering-rounds/{roundId}/groups/{groupId}/rankings', () => {
    it('gets group rankings', async () => {
      const {
        climber,
        competition,
        round,
        boulder,
      } = await utils.givenReadyCompetition(BoulderingRoundRankingType.CIRCUIT);

      await utils.addBoulderingResult(
        competition,
        round,
        round.groups[0],
        boulder,
        climber,
        {
          climberId: climber.id,
          try: 1,
          zone: true,
          top: true,
        },
      );

      const res = await api
        .get(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}/rankings`,
        )
        .expect(200);

      const body: BoulderingGroupRankingsDto = res.body;

      expect(body.type).toEqual(BoulderingRoundRankingType.CIRCUIT);
      expect(body.data.boulders).toHaveLength(1);
      expect(body.data.boulders[0]).toEqual(boulder.id);

      const rankings = body.data.rankings as BoulderingCircuitRankingDto[];
      expect(rankings).toHaveLength(1);
      const ranking = rankings[0];

      expect(ranking.ranking).toEqual(1);
      expect(ranking.climber.id).toEqual(climber.id);
      expect(ranking.climber.club).toEqual(climber.club);
      expect(ranking.climber.firstName).toEqual(climber.firstName);
      expect(ranking.climber.lastName).toEqual(climber.lastName);
      expect(ranking.tops[0]).toEqual(true);
      expect(ranking.topsInTries[0]).toEqual(1);
      expect(ranking.zones[0]).toEqual(true);
      expect(ranking.zonesInTries[0]).toEqual(1);
    });
  });

  describe('POST /competitions/{competitionId}/bouldering-rounds/{roundId}/groups', () => {
    it('creates a bouldering group', async () => {
      const { competition, round } = await utils.givenReadyCompetition(
        BoulderingRoundRankingType.CIRCUIT,
      );

      const {
        user: juryPresident,
        credentials: juryPresidentCredentials,
      } = await utils.givenUser();

      const presidentJuryAuth = await utils.login(juryPresidentCredentials);
      await utils.addJuryPresidentInCompetition(juryPresident, competition);

      const dto: CreateBoulderingGroupDto = {
        name: 'super-name2',
      };

      const { body } = await api
        .post(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups`,
        )
        .set('Authorization', `Bearer ${presidentJuryAuth.token}`)
        .send(dto)
        .expect(201);

      expect(body).toHaveProperty('id');
      expect(body.name).toEqual(dto.name);
      expect(body.roundId).toEqual(round.id);
      expect(body.climbers).toHaveLength(0);
      expect(body.boulders).toHaveLength(0);
      expect(body.state).toEqual(BoulderingGroupState.PENDING);
    });

    it('returns 401 when creating a round without auth', async () => {
      const { competition, round } = await utils.givenReadyCompetition(
        BoulderingRoundRankingType.CIRCUIT,
      );

      const dto: CreateBoulderingGroupDto = {
        name: 'super-name',
      };

      await api
        .post(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups`,
        )
        .send(dto)
        .expect(401);
    });

    it('returns 403 when creating a round without being jury president', async () => {
      const {
        competition,
        round,
        judgeAuth,
      } = await utils.givenReadyCompetition(BoulderingRoundRankingType.CIRCUIT);

      const dto: CreateBoulderingGroupDto = {
        name: 'super-name',
      };

      await api
        .post(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups`,
        )
        .set('Authorization', `Bearer ${judgeAuth.token}`)
        .send(dto)
        .expect(403);
    });
  });

  describe('DELETE /competitions/{competitionId}/bouldering-rounds/{roundId}/groups/competitions/{competitionId}/bouldering-rounds/{roundId}/groups/{groupId}', () => {
    it('deletes a bouldering group', async () => {
      const { competition, round } = await utils.givenReadyCompetition(
        BoulderingRoundRankingType.CIRCUIT,
      );

      const {
        user: juryPresident,
        credentials: juryPresidentCredentials,
      } = await utils.givenUser();

      const presidentJuryAuth = await utils.login(juryPresidentCredentials);
      await utils.addJuryPresidentInCompetition(juryPresident, competition);

      await api
        .delete(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}`,
        )
        .set('Authorization', `Bearer ${presidentJuryAuth.token}`)
        .expect(204);

      return expect(
        utils.getBoulderingGroup(round.groups[0].id),
      ).rejects.toBeInstanceOf(Error);
    });

    it('returns 401 when deleting a bouldering round without auth', async () => {
      const { competition, round } = await utils.givenReadyCompetition(
        BoulderingRoundRankingType.CIRCUIT,
      );

      await api
        .delete(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}`,
        )
        .expect(401);
    });

    it('returns 403 when deleting a bouldering round without being jury president', async () => {
      const {
        competition,
        round,
        judgeAuth,
      } = await utils.givenReadyCompetition(BoulderingRoundRankingType.CIRCUIT);

      await api
        .delete(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}`,
        )
        .set('Authorization', `Bearer ${judgeAuth.token}`)
        .expect(403);
    });
  });

  describe('DELETE /competitions/{competitionId}/bouldering-rounds/{roundId}', () => {
    it('deletes a bouldering group', async () => {
      const { competition, round } = await utils.givenReadyCompetition(
        BoulderingRoundRankingType.CIRCUIT,
      );

      const {
        user: juryPresident,
        credentials: juryPresidentCredentials,
      } = await utils.givenUser();

      const presidentJuryAuth = await utils.login(juryPresidentCredentials);
      await utils.addJuryPresidentInCompetition(juryPresident, competition);

      await api
        .delete(`/competitions/${competition.id}/bouldering-rounds/${round.id}`)
        .set('Authorization', `Bearer ${presidentJuryAuth.token}`)
        .expect(204);

      expect(await utils.getBoulderingRound(round.id)).toBeNull();
    });

    it('returns 401 when deleting a bouldering round without auth', async () => {
      const { competition, round } = await utils.givenReadyCompetition(
        BoulderingRoundRankingType.CIRCUIT,
      );

      await api
        .delete(`/competitions/${competition.id}/bouldering-rounds/${round.id}`)
        .expect(401);
    });

    it('returns 403 when deleting a bouldering round without being jury president', async () => {
      const {
        competition,
        round,
        judgeAuth,
      } = await utils.givenReadyCompetition(BoulderingRoundRankingType.CIRCUIT);

      await api
        .delete(`/competitions/${competition.id}/bouldering-rounds/${round.id}`)
        .set('Authorization', `Bearer ${judgeAuth.token}`)
        .expect(403);
    });
  });

  describe('PATCH /competitions/{competitionId}/bouldering-rounds/{roundId}', () => {
    it('updates a bouldering round', async () => {
      const { competition, round } = await utils.givenReadyCompetition(
        BoulderingRoundRankingType.CIRCUIT,
      );

      const {
        user: juryPresident,
        credentials: juryPresidentCredentials,
      } = await utils.givenUser();

      const presidentJuryAuth = await utils.login(juryPresidentCredentials);
      await utils.addJuryPresidentInCompetition(juryPresident, competition);

      const dto: UpdateBoulderingRoundDto = {
        name: uuid.v4(),
      };

      const { body } = await api
        .patch(`/competitions/${competition.id}/bouldering-rounds/${round.id}`)
        .set('Authorization', `Bearer ${presidentJuryAuth.token}`)
        .send(dto)
        .expect(200);

      expect(body.id).toEqual(round.id);
      expect(body.name).toEqual(dto.name);
    });

    it('returns 401 when updating a bouldering round without auth', async () => {
      const { competition, round } = await utils.givenReadyCompetition(
        BoulderingRoundRankingType.CIRCUIT,
      );

      await api
        .patch(`/competitions/${competition.id}/bouldering-rounds/${round.id}`)
        .expect(401);
    });

    it('returns 403 when updating a bouldering round without being jury president', async () => {
      const {
        competition,
        round,
        judgeAuth,
      } = await utils.givenReadyCompetition(BoulderingRoundRankingType.CIRCUIT);

      await api
        .patch(`/competitions/${competition.id}/bouldering-rounds/${round.id}`)
        .set('Authorization', `Bearer ${judgeAuth.token}`)
        .expect(403);
    });
  });

  describe('GET /{competitionId}/bouldering-rounds', () => {
    it('gets bouldering rounds by category by sex by type', async () => {
      const { user } = await utils.givenUser();

      const competition = await utils.givenCompetition(user, {
        categories: [
          {
            name: CategoryName.Microbe,
            sex: Sex.Female,
          },
          {
            name: CategoryName.Microbe,
            sex: Sex.Male,
          },
          {
            name: CategoryName.Poussin,
            sex: Sex.Male,
          },
        ],
      });

      const maleMicrobeQualifierRound = await utils.addBoulderingRound(
        competition,
        {
          type: CompetitionRoundType.QUALIFIER,
          category: CategoryName.Microbe,
          sex: Sex.Male,
        },
      );

      const maleMicrobeSemiFinalRound = await utils.addBoulderingRound(
        competition,
        {
          type: CompetitionRoundType.SEMI_FINAL,
          category: CategoryName.Microbe,
          sex: Sex.Male,
        },
      );

      const maleMicrobeFinalRound = await utils.addBoulderingRound(
        competition,
        {
          type: CompetitionRoundType.FINAL,
          category: CategoryName.Microbe,
          sex: Sex.Male,
        },
      );

      const femaleMicrobeQualifierRound = await utils.addBoulderingRound(
        competition,
        {
          type: CompetitionRoundType.QUALIFIER,
          category: CategoryName.Microbe,
          sex: Sex.Female,
        },
      );

      const malePoussinQualifierRound = await utils.addBoulderingRound(
        competition,
        {
          type: CompetitionRoundType.QUALIFIER,
          category: CategoryName.Poussin,
          sex: Sex.Male,
        },
      );

      const { body } = await api
        .get(`/competitions/${competition.id}/bouldering-rounds`)
        .expect(200);

      // MALE MICROBE
      expect(body).toHaveProperty(CategoryName.Microbe);
      expect(body[CategoryName.Microbe]).toHaveProperty(Sex.Male);
      expect(body[CategoryName.Microbe][Sex.Male]).toHaveProperty(
        CompetitionRoundType.QUALIFIER,
      );

      expect(
        body[CategoryName.Microbe][Sex.Male][CompetitionRoundType.QUALIFIER].id,
      ).toEqual(maleMicrobeQualifierRound.id);

      expect(body[CategoryName.Microbe][Sex.Male]).toHaveProperty(
        CompetitionRoundType.SEMI_FINAL,
      );

      expect(
        body[CategoryName.Microbe][Sex.Male][CompetitionRoundType.SEMI_FINAL]
          .id,
      ).toEqual(maleMicrobeSemiFinalRound.id);

      expect(body[CategoryName.Microbe][Sex.Male]).toHaveProperty(
        CompetitionRoundType.FINAL,
      );

      expect(
        body[CategoryName.Microbe][Sex.Male][CompetitionRoundType.FINAL].id,
      ).toEqual(maleMicrobeFinalRound.id);

      // FEMALE MICROBE
      expect(body[CategoryName.Microbe]).toHaveProperty(Sex.Female);
      expect(body[CategoryName.Microbe][Sex.Female]).toHaveProperty(
        CompetitionRoundType.QUALIFIER,
      );

      expect(body[CategoryName.Microbe][Sex.Female]).not.toHaveProperty(
        CompetitionRoundType.SEMI_FINAL,
      );

      expect(body[CategoryName.Microbe][Sex.Female]).not.toHaveProperty(
        CompetitionRoundType.FINAL,
      );

      expect(
        body[CategoryName.Microbe][Sex.Female][CompetitionRoundType.QUALIFIER]
          .id,
      ).toEqual(femaleMicrobeQualifierRound.id);

      // POUSSIN MALE
      expect(body).toHaveProperty(CategoryName.Poussin);
      expect(body[CategoryName.Poussin]).toHaveProperty(Sex.Male);
      expect(body[CategoryName.Poussin][Sex.Male]).toHaveProperty(
        CompetitionRoundType.QUALIFIER,
      );

      expect(body[CategoryName.Poussin][Sex.Male]).not.toHaveProperty(
        CompetitionRoundType.SEMI_FINAL,
      );

      expect(body[CategoryName.Poussin][Sex.Male]).not.toHaveProperty(
        CompetitionRoundType.FINAL,
      );

      expect(
        body[CategoryName.Poussin][Sex.Male][CompetitionRoundType.QUALIFIER].id,
      ).toEqual(malePoussinQualifierRound.id);

      expect(body[CategoryName.Poussin]).not.toHaveProperty(Sex.Female);

      // OTHERS
      expect(body).not.toHaveProperty(CategoryName.Benjamin);
      expect(body).not.toHaveProperty(CategoryName.Minime);
      expect(body).not.toHaveProperty(CategoryName.Cadet);
      expect(body).not.toHaveProperty(CategoryName.Junior);
      expect(body).not.toHaveProperty(CategoryName.Senior);
      expect(body).not.toHaveProperty(CategoryName.Veteran);
    });
  });

  describe('PUT /{competitionId}/bouldering-rounds/{roundId}/groups/{groupId}/boulders/{boulderId}/judges/{judgeId}', () => {
    it('assigns a judge to a boulder', async () => {
      const {
        competition,
        juryPresidentAuth,
        round,
        boulder,
      } = await utils.givenReadyCompetition(BoulderingRoundRankingType.CIRCUIT);

      const { user: judge } = await utils.givenUser();
      await utils.addJudgeInCompetition(judge, competition);

      await api
        .put(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}/boulders/${boulder.id}/judges/${judge.id}`,
        )
        .set('Authorization', `Bearer ${juryPresidentAuth.token}`)
        .expect(204);

      const boulderJudges = await utils.getBoulderJudges(boulder.id);
      expect(boulderJudges).toHaveLength(2);

      const expectedJudge = boulderJudges.find((j) => j.id === judge.id);
      expect(expectedJudge).not.toBeUndefined();
    });

    it('returns 401 when assigning a judge to a boulder without auth', async () => {
      await api
        .put(`/competitions/1/bouldering-rounds/2/groups/3/boulders/4/judges/5`)
        .expect(401);
    });

    it('returns 403 when assigning a judge to a boulder without being jury president', async () => {
      const {
        competition,
        judge,
        judgeAuth,
        round,
        boulder,
      } = await utils.givenReadyCompetition(BoulderingRoundRankingType.CIRCUIT);

      await api
        .put(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}/boulders/${boulder.id}/judges/${judge.id}`,
        )
        .set('Authorization', `Bearer ${judgeAuth.token}`)
        .expect(403);
    });
  });

  describe('DELETE /{competitionId}/bouldering-rounds/{roundId}/groups/{groupId}/boulders/{boulderId}/judges/{judgeId}', () => {
    it('removes a judge assignment of a boulder', async () => {
      const {
        competition,
        juryPresidentAuth,
        judge,
        round,
        boulder,
      } = await utils.givenReadyCompetition(BoulderingRoundRankingType.CIRCUIT);

      await api
        .delete(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}/boulders/${boulder.id}/judges/${judge.id}`,
        )
        .set('Authorization', `Bearer ${juryPresidentAuth.token}`)
        .expect(204);

      const judges = await utils.getBoulderJudges(boulder.id);
      expect(judges).toHaveLength(0);
    });

    it('returns 401 when trying to remove a judge assignment of a boulder without auth', async () => {
      await api
        .delete(
          `/competitions/1/bouldering-rounds/2/groups/3/boulders/4/judges/5`,
        )
        .expect(401);
    });

    it('returns 403 when trying to remove a judge assigment of a boulder without being jury president', async () => {
      const {
        competition,
        judge,
        judgeAuth,
        round,
        boulder,
      } = await utils.givenReadyCompetition(BoulderingRoundRankingType.CIRCUIT);

      await api
        .delete(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}/boulders/${boulder.id}/judges/${judge.id}`,
        )
        .set('Authorization', `Bearer ${judgeAuth.token}`)
        .expect(403);
    });
  });

  describe('GET /{competitionId}/bouldering-rounds/{roundId}/groups/{groupId}/boulders', () => {
    it('gets group boulders', async () => {
      const {
        competition,
        round,
        boulder,
        judge,
      } = await utils.givenReadyCompetition(BoulderingRoundRankingType.CIRCUIT);

      const { body } = await api
        .get(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}/boulders`,
        )
        .expect(200);

      expect(body).toHaveLength(1);
      expect(body[0].id).toEqual(boulder.id);
      expect(body[0].judges).toHaveLength(1);
      expect(body[0].judges[0].id).toEqual(judge.id);
      expect(body[0].judges[0].firstName).toEqual(judge.firstName);
      expect(body[0].judges[0].lastName).toEqual(judge.lastName);
    });
  });

  describe('GET /{competitionId}/bouldering-rounds/{roundId}/groups', () => {
    it('gets bouldering groups', async () => {
      const {
        competition,
        round,
        climber,
        boulder,
        judge,
      } = await utils.givenReadyCompetition(BoulderingRoundRankingType.CIRCUIT);

      const { body } = await api
        .get(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups`,
        )
        .expect(200);

      expect(body).toHaveLength(1);
      expect(body[0].roundId).toEqual(round.id);
      expect(body[0].id).toEqual(round.groups.getItems()[0].id);
      expect(body[0].climbers[0].id).toEqual(climber.id);
      expect(body[0].climbers[0].firstName).toEqual(climber.firstName);
      expect(body[0].climbers[0].lastName).toEqual(climber.lastName);
      expect(body[0].boulders[0].id).toEqual(boulder.id);
      expect(body[0].boulders[0].judges[0].id).toEqual(judge.id);
    });
  });

  describe('POST /{competitionId}/bouldering-rounds/{roundId}/groups/{groupId}/bulk-results', () => {
    it('adds bulk results', async () => {
      const {
        competition,
        round,
        juryPresidentAuth,
        climber,
        boulder,
      } = await utils.givenReadyCompetition(BoulderingRoundRankingType.CIRCUIT);

      const dto: BulkBoulderingResultsDto = {
        results: [
          {
            type: BoulderingRoundRankingType.CIRCUIT,
            climberId: climber.id,
            boulderId: boulder.id,
            top: true,
            zone: true,
            topInTries: 1,
            zoneInTries: 1,
          },
        ],
      };

      const res = await api
        .post(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}/bulk-results`,
        )
        .set('Authorization', `Bearer ${juryPresidentAuth.token}`)
        .send(dto)
        .expect(201);

      const body = res.body as BoulderingGroupRankingsDto;
      expect(body.type).toEqual(BoulderingRoundRankingType.CIRCUIT);

      const circuitRankings = body.data as CircuitGroupRankingsDto;
      expect(circuitRankings.rankings[0].climber.id).toEqual(climber.id);
      expect(circuitRankings.rankings[0].ranking).toEqual(1);
      expect(circuitRankings.rankings[0].tops).toEqual([true]);
      expect(circuitRankings.rankings[0].topsInTries).toEqual([1]);
      expect(circuitRankings.rankings[0].zones).toEqual([true]);
      expect(circuitRankings.rankings[0].zonesInTries).toEqual([1]);
    });

    it('validates bulk results with an empty array', async () => {
      const {
        competition,
        round,
        juryPresidentAuth,
      } = await utils.givenReadyCompetition(BoulderingRoundRankingType.CIRCUIT);

      const dto: BulkBoulderingResultsDto = {
        results: [],
      };

      const { body } = await api
        .post(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}/bulk-results`,
        )
        .set('Authorization', `Bearer ${juryPresidentAuth.token}`)
        .send(dto)
        .expect(422);

      expect(body.errors[0].property).toEqual('results');
      expect(body.errors[0].constraints).toHaveProperty('arrayNotEmpty');
    });

    it('validates bulk results for a circuit', async () => {
      const {
        competition,
        round,
        juryPresidentAuth,
        climber,
        boulder,
      } = await utils.givenReadyCompetition(BoulderingRoundRankingType.CIRCUIT);

      const dto: BulkBoulderingResultsDto = {
        results: [
          {
            type: BoulderingRoundRankingType.CIRCUIT,
            climberId: climber.id,
            boulderId: boulder.id,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            top: 123,
            zone: true,
            topInTries: 1,
            zoneInTries: 1,
          },
        ],
      };

      const { body } = await api
        .post(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}/bulk-results`,
        )
        .set('Authorization', `Bearer ${juryPresidentAuth.token}`)
        .send(dto)
        .expect(422);

      expect(body.errors[0].property).toEqual('results');
      expect(body.errors[0].children[0].property).toEqual('0');
      expect(body.errors[0].children[0].children[0].property).toEqual('top');
      expect(body.errors[0].children[0].children[0].constraints).toHaveProperty(
        'isBoolean',
      );
    });

    it('validates bulk results for a limited contest', async () => {
      const {
        competition,
        round,
        juryPresidentAuth,
        climber,
        boulder,
      } = await utils.givenReadyCompetition(
        BoulderingRoundRankingType.LIMITED_CONTEST,
        {
          maxTries: 5,
        },
      );

      const dto: BulkBoulderingResultsDto = {
        results: [
          {
            type: BoulderingRoundRankingType.LIMITED_CONTEST,
            climberId: climber.id,
            boulderId: boulder.id,
            top: true,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            zone: 123,
            topInTries: 1,
            zoneInTries: 1,
          },
        ],
      };

      const { body } = await api
        .post(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}/bulk-results`,
        )
        .set('Authorization', `Bearer ${juryPresidentAuth.token}`)
        .send(dto)
        .expect(422);

      expect(body.errors[0].property).toEqual('results');
      expect(body.errors[0].children[0].property).toEqual('0');
      expect(body.errors[0].children[0].children[0].property).toEqual('zone');
      expect(body.errors[0].children[0].children[0].constraints).toHaveProperty(
        'isBoolean',
      );
    });

    it('validates bulk results for an unlimited contest', async () => {
      const {
        competition,
        round,
        juryPresidentAuth,
        climber,
        boulder,
      } = await utils.givenReadyCompetition(
        BoulderingRoundRankingType.UNLIMITED_CONTEST,
      );

      const dto: BulkBoulderingResultsDto = {
        results: [
          {
            type: BoulderingRoundRankingType.UNLIMITED_CONTEST,
            climberId: climber.id,
            boulderId: boulder.id,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            top: '123',
          },
        ],
      };

      const { body } = await api
        .post(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}/bulk-results`,
        )
        .set('Authorization', `Bearer ${juryPresidentAuth.token}`)
        .send(dto)
        .expect(422);

      expect(body.errors[0].property).toEqual('results');
      expect(body.errors[0].children[0].property).toEqual('0');
      expect(body.errors[0].children[0].children[0].property).toEqual('top');
      expect(body.errors[0].children[0].children[0].constraints).toHaveProperty(
        'isBoolean',
      );
    });

    it('returns 401 when adding bulk results without auth', async () => {
      const { competition, round } = await utils.givenReadyCompetition(
        BoulderingRoundRankingType.CIRCUIT,
      );

      await api
        .post(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}/bulk-results`,
        )
        .expect(401);
    });

    it('returns 403 when adding bulk results without being the jury president', async () => {
      const {
        competition,
        round,
        judgeAuth,
      } = await utils.givenReadyCompetition(BoulderingRoundRankingType.CIRCUIT);

      await api
        .post(
          `/competitions/${competition.id}/bouldering-rounds/${round.id}/groups/${round.groups[0].id}/bulk-results`,
        )
        .set('Authorization', `Bearer ${judgeAuth.token}`)
        .expect(403);
    });
  });
});
