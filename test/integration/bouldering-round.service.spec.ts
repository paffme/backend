import { Competition } from '../../src/competition/competition.entity';
import { CreateBoulderingRoundDto } from '../../src/competition/dto/in/body/create-bouldering-round.dto';
import {
  BoulderingRound,
  BoulderingRoundRankingType,
  BoulderingRoundType,
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
import { UnprocessableEntityException } from '@nestjs/common';
import { CompetitionType } from '../../src/competition/types/competition-type.enum';
import { BoulderingRankingService } from '../../src/bouldering/ranking/bouldering-ranking.service';

describe('Bouldering round service (integration)', () => {
  let boulderingRoundService: BoulderingRoundService;
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

    utils = new TestUtils(
      module.get(UserService),
      module.get(CompetitionService),
    );
  });

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
    });

    expect(firstRound.index).toEqual(0);

    const secondRound = await boulderingRoundService.createRound(competition, {
      rankingType: BoulderingRoundRankingType.CIRCUIT,
      type: BoulderingRoundType.FINAL,
      quota: 0,
      name: 'SuperRound2',
      boulders: 4,
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
    });

    expect(firstRound.index).toEqual(0);

    const secondRound = await boulderingRoundService.createRound(competition, {
      rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
      type: BoulderingRoundType.QUALIFIER,
      quota: 0,
      name: 'SuperRound',
      boulders: 4,
      index: 0,
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
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });
});
