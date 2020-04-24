import { Competition } from '../../src/competition/competition.entity';
import { CreateBoulderingRoundDto } from '../../src/competition/dto/in/body/create-bouldering-round.dto';
import {
  BoulderingRound,
  BoulderingRoundRankingType,
  BoulderingRoundState,
  BoulderingRoundType,
  BoulderingRoundUnlimitedContestRankings,
} from '../../src/bouldering/round/bouldering-round.entity';
import { BoulderingRoundService } from '../../src/bouldering/round/bouldering-round.service';
import TestUtils from '../utils';
import { Test } from '@nestjs/testing';
import { UserService } from '../../src/user/user.service';
import { MikroOrmModule } from 'nestjs-mikro-orm';
import config from '../../src/mikro-orm.config';
import { User } from '../../src/user/user.entity';
import { SharedModule } from '../../src/shared/shared.module';
import { CompetitionService } from '../../src/competition/competition.service';
import { BoulderingResultService } from '../../src/bouldering/result/bouldering-result.service';
import { BoulderService } from '../../src/bouldering/boulder/boulder.service';
import { BoulderingRoundUnlimitedContestRankingService } from '../../src/bouldering/round/ranking/bouldering-round-unlimited-contest-ranking.service';
import { BoulderingRoundCountedRankingService } from '../../src/bouldering/round/ranking/bouldering-round-counted-ranking.service';
import { BoulderingResult } from '../../src/bouldering/result/bouldering-result.entity';
import { CompetitionRegistration } from '../../src/shared/entity/competition-registration.entity';
import { Boulder } from '../../src/bouldering/boulder/boulder.entity';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CompetitionType } from '../../src/competition/types/competition-type.enum';
import { BoulderingRankingService } from '../../src/bouldering/ranking/bouldering-ranking.service';
import { CategoryName } from '../../src/shared/types/category-name.enum';
import { Sex } from '../../src/shared/types/sex.enum';
import { CreateBoulderingResultDto } from '../../src/competition/dto/in/body/create-bouldering-result.dto';

describe('Bouldering round service (integration)', () => {
  let boulderingRoundService: BoulderingRoundService;
  let boulderService: BoulderService;
  let utils: TestUtils;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        BoulderingRoundService,
        BoulderingResultService,
        CompetitionService,
        BoulderService,
        BoulderingRoundUnlimitedContestRankingService,
        BoulderingRoundCountedRankingService,
        BoulderingRankingService,
      ],
      imports: [
        MikroOrmModule.forRoot(config),
        MikroOrmModule.forFeature({
          entities: [
            User,
            Competition,
            CompetitionRegistration,
            BoulderingRound,
            BoulderingResult,
            Boulder,
          ],
        }),
        SharedModule,
      ],
    }).compile();

    boulderingRoundService = module.get(BoulderingRoundService);
    boulderService = module.get(BoulderService);

    utils = new TestUtils(
      module.get(UserService),
      module.get(CompetitionService),
    );
  });

  async function givenBoulderingRound(
    partialDto?: Partial<CreateBoulderingRoundDto & BoulderingRound>,
  ): Promise<BoulderingRound> {
    const { user: organizer } = await utils.givenUser();

    const competition = await utils.givenCompetition(organizer, {
      type: CompetitionType.Bouldering,
    });

    const dto: CreateBoulderingRoundDto = {
      rankingType:
        partialDto?.rankingType ?? BoulderingRoundRankingType.UNLIMITED_CONTEST,
      type: partialDto?.type ?? BoulderingRoundType.QUALIFIER,
      quota: partialDto?.quota ?? 0,
      name: partialDto?.name ?? 'SuperRound',
      boulders: partialDto?.boulders ?? 4,
      category: partialDto?.category ?? CategoryName.Minime,
      sex: partialDto?.sex ?? Sex.Female,
    };

    const round = await boulderingRoundService.createRound(competition, dto);
    round.state = partialDto?.state ?? round.state;
    return round;
  }

  it('should create a round', async () => {
    const { user: organizer } = await utils.givenUser();

    const competition = await utils.givenCompetition(organizer, {
      type: CompetitionType.Bouldering,
    });

    const dto: CreateBoulderingRoundDto = {
      rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
      type: BoulderingRoundType.QUALIFIER,
      quota: 0,
      name: 'SuperRound',
      boulders: 4,
      category: CategoryName.Minime,
      sex: Sex.Female,
    };

    const round = await boulderingRoundService.createRound(competition, dto);
    expect(round.index).toEqual(0);
    expect(round.name).toEqual(dto.name);
    expect(round).toHaveProperty('id');
  });

  it('should create a round and put it at the last one if no index is specified', async () => {
    const { user: organizer } = await utils.givenUser();

    const competition = await utils.givenCompetition(organizer, {
      type: CompetitionType.Bouldering,
    });

    const firstRound = await boulderingRoundService.createRound(competition, {
      rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
      type: BoulderingRoundType.QUALIFIER,
      quota: 0,
      name: 'SuperRound1',
      boulders: 4,
      category: CategoryName.Minime,
      sex: Sex.Female,
    });

    expect(firstRound.index).toEqual(0);

    const secondRound = await boulderingRoundService.createRound(competition, {
      rankingType: BoulderingRoundRankingType.CIRCUIT,
      type: BoulderingRoundType.FINAL,
      quota: 0,
      name: 'SuperRound2',
      boulders: 4,
      category: CategoryName.Minime,
      sex: Sex.Female,
    });

    expect(secondRound.index).toEqual(1);
  });

  it('should create a round and shift other rounds', async () => {
    const { user: organizer } = await utils.givenUser();

    const competition = await utils.givenCompetition(organizer, {
      type: CompetitionType.Bouldering,
    });

    const firstRound = await boulderingRoundService.createRound(competition, {
      rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
      type: BoulderingRoundType.QUALIFIER,
      quota: 0,
      name: 'SuperRound1',
      boulders: 4,
      category: CategoryName.Minime,
      sex: Sex.Female,
    });

    expect(firstRound.index).toEqual(0);

    const secondRound = await boulderingRoundService.createRound(competition, {
      rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
      type: BoulderingRoundType.QUALIFIER,
      quota: 0,
      name: 'SuperRound',
      boulders: 4,
      index: 0,
      category: CategoryName.Minime,
      sex: Sex.Female,
    });

    expect(firstRound.index).toEqual(1);
    expect(secondRound.index).toEqual(0);
  });

  it('adds the registered climbers if the round if the first one', async () => {
    const { user: organizer } = await utils.givenUser();
    const { user: climber } = await utils.givenUser();

    const competition = await utils.givenCompetition(organizer, {
      type: CompetitionType.Bouldering,
    });

    await utils.registerUserInCompetition(climber, competition);

    const round = await boulderingRoundService.createRound(competition, {
      rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
      type: BoulderingRoundType.QUALIFIER,
      quota: 0,
      name: 'SuperRound1',
      boulders: 4,
      category: CategoryName.Minime,
      sex: Sex.Female,
    });

    const climbers = round.climbers.getItems();

    expect(climbers).toHaveLength(1);
    expect(climbers[0]).toBe(climber);
  });

  it('throws when adding a round with an index to far', async () => {
    const { user: organizer } = await utils.givenUser();

    const competition = await utils.givenCompetition(organizer, {
      type: CompetitionType.Bouldering,
    });

    const firstRound = await boulderingRoundService.createRound(competition, {
      rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
      type: BoulderingRoundType.QUALIFIER,
      quota: 0,
      name: 'SuperRound1',
      boulders: 4,
      category: CategoryName.Minime,
      sex: Sex.Female,
    });

    expect(firstRound.index).toEqual(0);

    return expect(
      boulderingRoundService.createRound(competition, {
        rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
        type: BoulderingRoundType.QUALIFIER,
        quota: 0,
        name: 'SuperRound',
        boulders: 4,
        index: 2,
        category: CategoryName.Minime,
        sex: Sex.Female,
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('adds a climber when is in pending state', async () => {
    const round = await givenBoulderingRound({
      state: BoulderingRoundState.PENDING,
    });

    const { user: climber } = await utils.givenUser();

    await boulderingRoundService.addClimber(round, climber);
    expect(round.climbers.contains(climber)).toEqual(true);
  });

  it('adds a climber when is in ongoing state', async () => {
    const round = await givenBoulderingRound({
      state: BoulderingRoundState.ONGOING,
    });

    const { user: climber } = await utils.givenUser();

    await boulderingRoundService.addClimber(round, climber);
    expect(round.climbers.contains(climber)).toEqual(true);
  });

  it('does not add a climber when the state is ended', async () => {
    const round = await givenBoulderingRound({
      state: BoulderingRoundState.ENDED,
    });

    const { user: climber } = await utils.givenUser();

    return expect(
      boulderingRoundService.addClimber(round, climber),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('adds a result', async () => {
    const { user: climber } = await utils.givenUser();
    const round = await givenBoulderingRound();
    await boulderingRoundService.addClimber(round, climber);
    const dto = {} as CreateBoulderingResultDto;

    const result = await boulderingRoundService.addResult(
      round.id,
      round.boulders.getItems()[0].id,
      climber,
      dto,
    );

    expect(result).toBeTruthy();
    expect(result).toHaveProperty('id');
    expect(result.climber).toBe(climber);
    expect(result.round).toBe(round);
    expect(result.boulder).toBe(round.boulders.getItems()[0]);
  });

  it('updates the rankings after adding a result', async () => {
    const { user: climber } = await utils.givenUser();
    const round = await givenBoulderingRound({
      rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
    });

    await boulderingRoundService.addClimber(round, climber);
    const dto = {} as CreateBoulderingResultDto;

    await boulderingRoundService.addResult(
      round.id,
      round.boulders.getItems()[0].id,
      climber,
      dto,
    );

    const rankings = round.rankings as BoulderingRoundUnlimitedContestRankings;

    expect(rankings).toBeTruthy();
    expect(rankings.type).toEqual(BoulderingRoundRankingType.UNLIMITED_CONTEST);
    expect(rankings.bouldersPoints).toHaveLength(round.boulders.count());

    for (let i = 0; i < round.boulders.count(); i++) {
      expect(rankings.bouldersPoints[i]).toEqual(1000);
    }

    expect(rankings.rankings).toHaveLength(1);
    expect(rankings.rankings[0].ranking).toEqual(1);
    expect(rankings.rankings[0].nbTops).toEqual(0);
    expect(rankings.rankings[0].points).toEqual(0);
    expect(rankings.rankings[0].climberId).toEqual(climber.id);
    expect(rankings.rankings[0].tops).toHaveLength(round.boulders.count());

    for (let i = 0; i < round.boulders.count(); i++) {
      expect(rankings.rankings[0].tops[i]).toEqual(false);
    }
  });

  it('does not add a result if the climber is not in the round', async () => {
    const { user: climber } = await utils.givenUser();
    const round = await givenBoulderingRound({
      rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
    });

    const dto = {} as CreateBoulderingResultDto;

    return expect(
      boulderingRoundService.addResult(
        round.id,
        round.boulders.getItems()[0].id,
        climber,
        dto,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not add a result if the climber boulder is not in the round', async () => {
    const { user: climber } = await utils.givenUser();

    const round = await givenBoulderingRound({
      rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
    });

    const anotherRound = await givenBoulderingRound({
      rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
    });

    const [boulder] = await boulderService.createMany(anotherRound, 1);
    await boulderingRoundService.addClimber(round, climber);
    const dto = {} as CreateBoulderingResultDto;

    return expect(
      boulderingRoundService.addResult(round.id, boulder.id, climber, dto),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws not found when adding a result to an unknown boulder', async () => {
    const { user: climber } = await utils.givenUser();

    const round = await givenBoulderingRound({
      rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
    });

    const dto = {} as CreateBoulderingResultDto;

    return expect(
      boulderingRoundService.addResult(round.id, 99999999, climber, dto),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws not found when adding a result to an unknown round', async () => {
    const { user: climber } = await utils.givenUser();

    const round = await givenBoulderingRound({
      rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
    });

    const [boulder] = await boulderService.createMany(round, 1);

    const dto = {} as CreateBoulderingResultDto;

    return expect(
      boulderingRoundService.addResult(9999999, boulder.id, climber, dto),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
