import TestUtils from '../utils';
import { UserService } from '../../src/user/user.service';
import { Test } from '@nestjs/testing';
import { MikroOrmModule } from 'nestjs-mikro-orm';
import { CompetitionService } from '../../src/competition/competition.service';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { Competition } from '../../src/competition/competition.entity';
import { CompetitionRegistration } from '../../src/shared/entity/competition-registration.entity';
import { User } from '../../src/user/user.entity';
import config from '../../src/mikro-orm.config';
import { SharedModule } from '../../src/shared/shared.module';
import { BoulderingRoundService } from '../../src/bouldering/round/bouldering-round.service';
import { BoulderingRound } from '../../src/bouldering/round/bouldering-round.entity';
import { BoulderingResult } from '../../src/bouldering/result/bouldering-result.entity';
import { BoulderingResultService } from '../../src/bouldering/result/bouldering-result.service';
import { BoulderService } from '../../src/bouldering/boulder/boulder.service';
import { Boulder } from '../../src/bouldering/boulder/boulder.entity';
import { BoulderingRoundUnlimitedContestRankingService } from '../../src/bouldering/ranking/bouldering-round-unlimited-contest-ranking.service';
import { BoulderingRoundCountedRankingService } from '../../src/bouldering/ranking/bouldering-round-counted-ranking.service';

describe('Competition service (integration)', () => {
  let competitionService: CompetitionService;
  let userService: UserService;
  let utils: TestUtils;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CompetitionService,
        UserService,
        BoulderingRoundService,
        BoulderingResultService,
        BoulderService,
        BoulderingRoundUnlimitedContestRankingService,
        BoulderingRoundCountedRankingService,
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

    competitionService = module.get(CompetitionService);
    userService = module.get(UserService);
    utils = new TestUtils(userService, competitionService);
  });

  it('adds the organizer on creation', async function () {
    const { user } = await utils.givenUser();
    const competitionData = utils.givenCompetitionData();
    const competition = await competitionService.create(competitionData, user);

    expect(competition.organizers.getItems()[0].id).toEqual(user.id);
  });

  it('do not removes the last organizer', async function () {
    const { user } = await utils.givenUser();
    const competition = await utils.givenCompetition(user);

    await expect(
      competitionService.removeOrganizer(competition.id, user.id),
    ).rejects.toBeInstanceOf(BadRequestException);

    const organizers = await utils.getOrganizers(competition);
    expect(organizers[0].id).toEqual(user.id);
  });

  it('do not add twice an organizer', async function () {
    const { user } = await utils.givenUser();
    const competition = await utils.givenCompetition(user);

    await expect(
      competitionService.addOrganizer(competition.id, user.id),
    ).rejects.toBeInstanceOf(ConflictException);

    const organizers = await utils.getOrganizers(competition);
    let counter = 0;

    for (const organizer of organizers) {
      if (organizer.id === user.id) {
        counter++;
      }
    }

    expect(counter).toEqual(1);
  });
});
