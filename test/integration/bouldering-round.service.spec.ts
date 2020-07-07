import { Competition } from '../../src/competition/competition.entity';
import { CreateBoulderingRoundDto } from '../../src/competition/dto/in/body/create-bouldering-round.dto';
import {
  BoulderingRound,
  BoulderingRoundRankingType,
  BoulderingRoundState,
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
import { BoulderingResult } from '../../src/bouldering/result/bouldering-result.entity';
import { CompetitionRegistration } from '../../src/shared/entity/competition-registration.entity';
import { Boulder } from '../../src/bouldering/boulder/boulder.entity';
import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CompetitionType } from '../../src/competition/types/competition-type.enum';
import { BoulderingRankingService } from '../../src/bouldering/ranking/bouldering-ranking.service';
import { CategoryName } from '../../src/shared/types/category-name.enum';
import { Sex } from '../../src/shared/types/sex.enum';
import { CreateBoulderingResultDto } from '../../src/competition/dto/in/body/create-bouldering-result.dto';
import {
  BoulderingGroup,
  BoulderingGroupState,
} from '../../src/bouldering/group/bouldering-group.entity';
import { BoulderingGroupService } from '../../src/bouldering/group/bouldering-group.service';
import { CreateCompetitionDTO } from '../../src/competition/dto/in/body/create-competition.dto';
import { CompetitionRoundType } from '../../src/competition/competition-round-type.enum';
import { UpdateBoulderingRoundDto } from '../../src/competition/dto/in/body/update-bouldering-round.dto';
import * as uuid from 'uuid';
import { givenCompetition } from '../fixture/competition.fixture';
import { MaxClimbersReachedError } from '../../src/bouldering/errors/max-climbers-reached.error';
import { BoulderingGroupUnlimitedContestRankingService } from '../../src/bouldering/group/ranking/bouldering-group-unlimited-contest-ranking.service';
import { BoulderingGroupLimitedContestRankingService } from '../../src/bouldering/group/ranking/bouldering-group-limited-contest-ranking.service';
import { BoulderingGroupCircuitRankingService } from '../../src/bouldering/group/ranking/bouldering-group-circuit-ranking.service';
import { PdfService } from '../../src/pdf/pdf.service';
import { HoldsRecognitionService } from '../../src/holds-recognition/holds-recognition.service';

describe('Bouldering round service (integration)', () => {
  let boulderingRoundService: BoulderingRoundService;
  let boulderingGroupService: BoulderingGroupService;
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
        BoulderingRankingService,
        BoulderingGroupService,
        BoulderingGroupUnlimitedContestRankingService,
        BoulderingGroupLimitedContestRankingService,
        BoulderingGroupCircuitRankingService,
        PdfService,
        HoldsRecognitionService,
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
            BoulderingGroup,
          ],
        }),
        SharedModule,
      ],
    }).compile();

    boulderingRoundService = module.get(BoulderingRoundService);
    boulderingGroupService = module.get(BoulderingGroupService);
    boulderService = module.get(BoulderService);

    utils = new TestUtils(
      module.get(UserService),
      module.get(CompetitionService),
      undefined,
      module.get('MikroORM'),
    );
  });

  async function givenBoulderingRound(
    partialDto?: Partial<CreateBoulderingRoundDto & BoulderingRound>,
    competitionData?: Partial<CreateCompetitionDTO>,
  ): Promise<BoulderingRound> {
    const { user: organizer } = await utils.givenUser();

    const competition = await utils.givenCompetition(organizer, {
      ...competitionData,
      type: CompetitionType.Bouldering,
    });

    const dto: CreateBoulderingRoundDto = {
      rankingType:
        partialDto?.rankingType ?? BoulderingRoundRankingType.UNLIMITED_CONTEST,
      type: partialDto?.type ?? CompetitionRoundType.QUALIFIER,
      name: partialDto?.name ?? 'SuperRound',
      boulders: partialDto?.boulders ?? 4,
      category: partialDto?.category ?? CategoryName.Minime,
      sex: partialDto?.sex ?? Sex.Female,
      groups: partialDto?.groups ?? 1,
    };

    return boulderingRoundService.createRound(competition, dto);
  }

  function givenBoulderingGroup(
    name: string,
    round: BoulderingRound,
  ): Promise<BoulderingGroup> {
    return boulderingGroupService.create(name, round);
  }

  it('should create a round', async () => {
    const { user: organizer } = await utils.givenUser();

    const competition = await utils.givenCompetition(organizer, {
      type: CompetitionType.Bouldering,
    });

    const dto: CreateBoulderingRoundDto = {
      rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
      type: CompetitionRoundType.QUALIFIER,
      name: 'SuperRound',
      boulders: 4,
      category: CategoryName.Minime,
      sex: Sex.Female,
    };

    const round = await boulderingRoundService.createRound(competition, dto);
    expect(round.name).toEqual(dto.name);
    expect(round).toHaveProperty('id');
  });

  it('adds the registered climbers if the round if the first one', async () => {
    const { user: organizer } = await utils.givenUser();
    const { user: climber } = await utils.givenUser({
      sex: Sex.Female,
      birthYear: 2006,
    });

    const competition = await utils.givenCompetition(organizer, {
      type: CompetitionType.Bouldering,
      startDate: new Date(2019, 10, 1),
    });

    await utils.registerUserInCompetition(climber, competition);

    const round = await boulderingRoundService.createRound(competition, {
      rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
      type: CompetitionRoundType.QUALIFIER,
      name: 'SuperRound1',
      boulders: 4,
      category: CategoryName.Minime,
      sex: Sex.Female,
    });

    const climbers = round.groups[0].climbers.getItems();

    expect(climbers).toHaveLength(1);
    expect(climbers[0]).toBe(climber);
  });

  it('adds a climber when is in pending state', async () => {
    const round = await givenBoulderingRound(
      {
        state: BoulderingRoundState.PENDING,
        sex: Sex.Female,
        category: CategoryName.Minime,
      },
      {
        startDate: new Date(2019, 10, 1),
      },
    );

    const { user: climber } = await utils.givenUser({
      sex: Sex.Female,
      birthYear: 2006,
    });

    await boulderingRoundService.addClimbers(round, climber);
    expect(round.groups[0].climbers.contains(climber)).toEqual(true);
  });

  it('adds climbers alternately in groups', async () => {
    const round = await givenBoulderingRound(
      {
        rankingType: BoulderingRoundRankingType.CIRCUIT,
        state: BoulderingRoundState.PENDING,
        sex: Sex.Female,
        category: CategoryName.Minime,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        groups: 2,
      },
      {
        startDate: new Date(2019, 10, 1),
      },
    );

    const { user: climber1 } = await utils.givenUser({
      sex: Sex.Female,
      birthYear: 2006,
    });

    const { user: climber2 } = await utils.givenUser({
      sex: Sex.Female,
      birthYear: 2006,
    });

    await boulderingRoundService.addClimbers(round, climber1, climber2);
    expect(round.groups[0].climbers).toContain(climber1);
    expect(round.groups[1].climbers).toContain(climber2);
  });

  it('adds a climber when is in ongoing state', async () => {
    const round = await givenBoulderingRound(
      {
        state: BoulderingRoundState.ONGOING,
        sex: Sex.Female,
        category: CategoryName.Minime,
      },
      {
        startDate: new Date(2019, 10, 1),
      },
    );

    const { user: climber } = await utils.givenUser({
      sex: Sex.Female,
      birthYear: 2006,
    });

    await boulderingRoundService.addClimbers(round, climber);
    expect(round.groups[0].climbers.contains(climber)).toEqual(true);
  });

  it('does not add a climber when the state is ended', async () => {
    const round = await givenBoulderingRound();
    round.groups.getItems()[0].state = BoulderingGroupState.ENDED;

    const { user: climber } = await utils.givenUser();

    return expect(
      boulderingRoundService.addClimbers(round, climber),
    ).rejects.toBeInstanceOf(MaxClimbersReachedError);
  });

  it('adds a result', async () => {
    const { user: climber } = await utils.givenUser({
      sex: Sex.Female,
      birthYear: 2006,
    });

    const round = await givenBoulderingRound(
      {
        sex: Sex.Female,
        category: CategoryName.Minime,
      },
      {
        startDate: new Date(2019, 10, 1),
      },
    );

    await boulderingRoundService.addClimbers(round, climber);
    const dto = {} as CreateBoulderingResultDto;

    await utils.updateBoulderingGroupState(
      round.groups.getItems()[0],
      BoulderingGroupState.ONGOING,
    );

    const result = await boulderingRoundService.addResult(
      round.id,
      round.groups[0].id,
      round.groups[0].boulders.getItems()[0].id,
      climber,
      dto,
    );

    expect(result).toBeTruthy();
    expect(result).toHaveProperty('id');
    expect(result.climber).toBe(climber);
    expect(result.group.round).toBe(round);
    expect(result.boulder).toBe(round.groups[0].boulders.getItems()[0]);
  });

  it('updates the rankings after adding a result', async () => {
    const { user: climber } = await utils.givenUser({
      sex: Sex.Female,
      birthYear: 2006,
    });

    const round = await givenBoulderingRound(
      {
        rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
        sex: Sex.Female,
        category: CategoryName.Minime,
      },
      {
        startDate: new Date(2019, 10, 1),
      },
    );

    await boulderingRoundService.addClimbers(round, climber);
    const dto = {} as CreateBoulderingResultDto;

    await utils.updateBoulderingGroupState(
      round.groups.getItems()[0],
      BoulderingGroupState.ONGOING,
    );

    await boulderingRoundService.addResult(
      round.id,
      round.groups[0].id,
      round.groups[0].boulders.getItems()[0].id,
      climber,
      dto,
    );

    const roundRankings = round.rankings! as BoulderingRoundUnlimitedContestRankings;

    expect(roundRankings).toBeTruthy();
    expect(roundRankings.type).toEqual(
      BoulderingRoundRankingType.UNLIMITED_CONTEST,
    );

    const rankings = roundRankings.rankings;

    expect(rankings).toHaveLength(1);
    expect(rankings[0].ranking).toEqual(1);
    expect(rankings[0].nbTops).toEqual(0);
    expect(rankings[0].points).toEqual(0);
    expect(rankings[0].climber.id).toEqual(climber.id);
    expect(rankings[0].tops).toHaveLength(round.groups[0].boulders.count());

    for (let i = 0; i < round.groups[0].boulders.count(); i++) {
      expect(rankings[0].tops[i]).toEqual(false);
    }
  });

  it('throws not found when adding a result to an unknown boulder', async () => {
    const { user: climber } = await utils.givenUser();

    const round = await givenBoulderingRound({
      rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
    });

    const dto = {} as CreateBoulderingResultDto;

    return expect(
      boulderingRoundService.addResult(
        round.id,
        round.groups[0].id,
        99999999,
        climber,
        dto,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws not found when adding a result to an unknown group', async () => {
    const { user: climber } = await utils.givenUser();

    const round = await givenBoulderingRound({
      rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
    });

    const group = await givenBoulderingGroup('newgroup', round);
    const [boulder] = await boulderService.createMany(group, 1);
    const dto = {} as CreateBoulderingResultDto;

    return expect(
      boulderingRoundService.addResult(
        round.id,
        9999999,
        boulder.id,
        climber,
        dto,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when trying to add a climber in a round without the same category', async () => {
    const { user: climber } = await utils.givenUser({
      birthYear: 2000,
      sex: Sex.Female,
    });

    const round = await givenBoulderingRound({
      rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
      category: CategoryName.Senior,
      sex: Sex.Male,
    });

    return expect(
      boulderingRoundService.addClimbers(round, climber),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('updates a bouldering round', async () => {
    const competition = givenCompetition();
    const round = await givenBoulderingRound();

    const dto: UpdateBoulderingRoundDto = {
      name: uuid.v4(),
    };

    const result = await boulderingRoundService.update(competition, round, dto);
    expect(result).toBe(round);
    expect(result.name).toEqual(dto.name);
  });
});
