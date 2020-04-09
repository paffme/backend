import TestUtils from '../utils';
import { UserService } from '../../src/user/user.service';
import { Test } from '@nestjs/testing';
import { MikroOrmModule } from 'nestjs-mikro-orm';
import config from '../../src/mikro-orm.config';
import { User } from '../../src/user/user.entity';
import { SharedModule } from '../../src/shared/shared.module';
import { CompetitionService } from '../../src/competition/competition.service';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Competition } from '../../src/competition/competition.entity';
import { CompetitionRegistration } from '../../src/shared/entity/competition-registration.entity';

describe('Competition service (integration)', () => {
  let competitionService: CompetitionService;
  let userService: UserService;
  let utils: TestUtils;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [CompetitionService, UserService],
      imports: [
        MikroOrmModule.forRoot(config),
        MikroOrmModule.forFeature({
          entities: [User, Competition, CompetitionRegistration],
        }),
        SharedModule,
      ],
    }).compile();

    competitionService = module.get(CompetitionService);
    userService = module.get(UserService);
    utils = new TestUtils(userService, competitionService);
  });

  it('returns 404 when getting an unknown registration', () => {
    return expect(
      competitionService.getRegistrations(999999),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 when deleting a registration on an unknown competition', async () => {
    const { user } = await utils.givenUser();

    return expect(
      competitionService.removeRegistration(999999, user.id),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 when deleting a registration on an unknown user', async () => {
    const { user } = await utils.givenUser();
    const competition = await utils.givenCompetition(user);

    return expect(
      competitionService.removeRegistration(competition.id, 999999),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 when deleting an unknown registration', async () => {
    const { user } = await utils.givenUser();
    const competition = await utils.givenCompetition(user);

    return expect(
      competitionService.removeRegistration(competition.id, user.id),
    ).rejects.toBeInstanceOf(NotFoundException);
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

  it('returns 404 when adding an unknown jury president', async function () {
    const { user } = await utils.givenUser();
    const competition = await utils.givenCompetition(user);

    return expect(
      competitionService.addJuryPresident(competition.id, 999999),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 when adding a jury president to a unknown competition', async function () {
    const { user } = await utils.givenUser();

    return expect(
      competitionService.addJuryPresident(999999, user.id),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 when removing an unknown organizer', async () => {
    const { user } = await utils.givenUser();
    const { user: secondUser } = await utils.givenUser();
    const competition = await utils.givenCompetition(user);

    return expect(
      competitionService.removeOrganizer(competition.id, secondUser.id),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
