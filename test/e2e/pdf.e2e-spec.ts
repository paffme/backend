import supertest from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { configure } from '../../src/app.configuration';
import TestUtils from '../utils';
import { NestExpressApplication } from '@nestjs/platform-express';
import { UserService } from '../../src/user/user.service';
import { CompetitionService } from '../../src/competition/competition.service';
import { BoulderingRoundRankingType } from '../../src/bouldering/round/bouldering-round.entity';
import { BoulderService } from '../../src/bouldering/boulder/boulder.service';
import { existsSync, promises as fs } from 'fs';
import * as path from 'path';
import gm from 'gm';
import { Sex } from '../../src/shared/types/sex.enum';
import { CompetitionType } from '../../src/competition/types/competition-type.enum';
import { CompetitionRoundType } from '../../src/competition/competition-round-type.enum';
import { CategoryName } from '../../src/shared/types/category-name.enum';
import { Competition } from '../../src/competition/competition.entity';
import { User } from '../../src/user/user.entity';

/* eslint-disable sonarjs/no-duplicate-string */

const snapshotsDir = path.resolve(__dirname, './pdf/snapshots');
const tmpDir = path.resolve(__dirname, './pdf/tmp');

describe('PDF (e2e)', () => {
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

  function isPdfPageEqual(
    firstPdfPath: string,
    secondPdfPath: string,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      gm.compare(
        firstPdfPath,
        secondPdfPath,
        {
          tolerance: 0,
        },
        (err, isEqual) => {
          if (err) {
            reject(err);
          }

          resolve(isEqual);
        },
      );
    });
  }

  async function snapshot(
    currentPdf: string,
    snapshotName: string,
  ): Promise<void> {
    const sanitizedSnapshotName = snapshotName
      .replace(/\s/g, '_')
      .toLowerCase();

    const currentPdfPath = getNewPdfFilePath(sanitizedSnapshotName);
    await fs.writeFile(currentPdfPath, currentPdf);

    const expectedSnapshotPath = path.resolve(
      snapshotsDir,
      sanitizedSnapshotName + '.pdf',
    );

    if (!existsSync(expectedSnapshotPath)) {
      await fs.copyFile(currentPdfPath, expectedSnapshotPath);
    } else {
      expect(
        await isPdfPageEqual(expectedSnapshotPath, currentPdfPath),
      ).toEqual(true);
    }
  }

  function getNewPdfFilePath(name: string): string {
    const filename = `${name}.pdf`;
    return path.resolve(__dirname, tmpDir, filename);
  }

  async function givenReadyCompetition(): Promise<Competition> {
    const { user: organizer } = await utils.givenUser();

    return utils.givenCompetition(organizer, {
      type: CompetitionType.Bouldering,
      startDate: new Date(2014, 10, 1),
      name: 'COMPETITION NAME',
      city: 'CITY',
    });
  }

  it.each([
    [
      'One circuit round',
      [
        {
          firstName: 'Gautier',
          lastName: 'Supper',
          club: 'Supper Club',
          birthYear: 1950,
          sex: Sex.Male,
        },
      ],
      [
        {
          round: {
            category: CategoryName.Veteran,
            sex: Sex.Male,
            type: CompetitionRoundType.QUALIFIER,
            rankingType: BoulderingRoundRankingType.CIRCUIT,
            groups: 1,
            boulders: 1,
          },
          groups: [
            {
              results: [[0, 0, { top: true, try: 1 }]],
            },
          ],
        },
      ],
    ],
    [
      'One limited contest round',
      [
        {
          firstName: 'Gautier',
          lastName: 'Supper',
          club: 'Supper Club',
          birthYear: 1950,
          sex: Sex.Male,
        },
      ],
      [
        {
          round: {
            category: CategoryName.Veteran,
            sex: Sex.Male,
            type: CompetitionRoundType.QUALIFIER,
            rankingType: BoulderingRoundRankingType.LIMITED_CONTEST,
            maxTries: 5,
            groups: 1,
            boulders: 1,
          },
          groups: [
            {
              results: [[0, 0, { top: true, try: 1 }]],
            },
          ],
        },
      ],
    ],
    [
      'One unlimited contest round',
      [
        {
          firstName: 'Gautier',
          lastName: 'Supper',
          club: 'Supper Club',
          birthYear: 1950,
          sex: Sex.Male,
        },
      ],
      [
        {
          round: {
            category: CategoryName.Veteran,
            sex: Sex.Male,
            type: CompetitionRoundType.QUALIFIER,
            rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
            groups: 1,
            boulders: 1,
          },
          groups: [
            {
              results: [[0, 0, { top: true }]],
            },
          ],
        },
      ],
    ],
    [
      'Two categories',
      [
        {
          firstName: 'Gautier',
          lastName: 'Supper',
          club: 'Supper Club',
          birthYear: 1950,
          sex: Sex.Male,
        },
        {
          firstName: 'Fanny',
          lastName: 'Gibert',
          club: 'Gibert Club',
          birthYear: 1950,
          sex: Sex.Female,
        },
      ],
      [
        {
          round: {
            category: CategoryName.Veteran,
            sex: Sex.Male,
            type: CompetitionRoundType.QUALIFIER,
            rankingType: BoulderingRoundRankingType.CIRCUIT,
            groups: 1,
            boulders: 1,
          },
          groups: [
            {
              results: [[0, 0, { top: true, try: 1 }]],
            },
          ],
        },
        {
          round: {
            category: CategoryName.Veteran,
            sex: Sex.Female,
            type: CompetitionRoundType.QUALIFIER,
            rankingType: BoulderingRoundRankingType.CIRCUIT,
            groups: 1,
            boulders: 1,
          },
          groups: [
            {
              results: [[1, 0, { top: true, try: 1 }]],
            },
          ],
        },
      ],
    ],
    [
      'One contest then one circuit',
      [
        {
          firstName: 'Gautier',
          lastName: 'Supper',
          club: 'Supper Club',
          birthYear: 1950,
          sex: Sex.Male,
        },
        {
          firstName: 'Gautier2',
          lastName: 'Supper',
          club: 'Supper Club',
          birthYear: 1950,
          sex: Sex.Male,
        },
        {
          firstName: 'Gautier3',
          lastName: 'Supper',
          club: 'Supper Club',
          birthYear: 1950,
          sex: Sex.Male,
        },
        {
          firstName: 'Gautier4',
          lastName: 'Supper',
          club: 'Supper Club',
          birthYear: 1950,
          sex: Sex.Male,
        },
      ],
      [
        {
          round: {
            category: CategoryName.Veteran,
            sex: Sex.Male,
            type: CompetitionRoundType.QUALIFIER,
            rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
            groups: 1,
            boulders: 3,
          },
          groups: [
            {
              results: [
                [0, 0, { top: true }],
                [0, 1, { top: true }],
                [0, 2, { top: true }],
                [1, 0, { top: true }],
                [1, 1, { top: true }],
                [1, 2, { top: false }],
                [2, 0, { top: true }],
                [2, 1, { top: false }],
                [2, 2, { top: false }],
                [3, 0, { top: false }],
                [3, 1, { top: false }],
                [3, 2, { top: false }],
              ],
            },
          ],
        },
        {
          round: {
            category: CategoryName.Veteran,
            sex: Sex.Male,
            type: CompetitionRoundType.FINAL,
            rankingType: BoulderingRoundRankingType.CIRCUIT,
            groups: 1,
            boulders: 1,
          },
          groups: [
            {
              results: [
                [0, 0, { top: true, zone: true, try: 1 }],
                [1, 0, { top: true, zone: true, try: 2 }],
                [2, 0, { top: true, zone: false, try: 1 }],
              ],
            },
          ],
        },
      ],
    ],
    [
      'One contest then two circuits',
      [
        {
          firstName: 'Gautier',
          lastName: 'Supper',
          club: 'Supper Club',
          birthYear: 1950,
          sex: Sex.Male,
        },
        {
          firstName: 'Gautier2',
          lastName: 'Supper',
          club: 'Supper Club',
          birthYear: 1950,
          sex: Sex.Male,
        },
        {
          firstName: 'Gautier3',
          lastName: 'Supper',
          club: 'Supper Club',
          birthYear: 1950,
          sex: Sex.Male,
        },
        {
          firstName: 'Gautier4',
          lastName: 'Supper',
          club: 'Supper Club',
          birthYear: 1950,
          sex: Sex.Male,
        },
      ],
      [
        {
          round: {
            category: CategoryName.Veteran,
            sex: Sex.Male,
            type: CompetitionRoundType.QUALIFIER,
            rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
            groups: 1,
            boulders: 3,
          },
          groups: [
            {
              results: [
                [0, 0, { top: true }],
                [0, 1, { top: true }],
                [0, 2, { top: true }],
                [1, 0, { top: true }],
                [1, 1, { top: true }],
                [1, 2, { top: false }],
                [2, 0, { top: true }],
                [2, 1, { top: false }],
                [2, 2, { top: false }],
                [3, 0, { top: false }],
                [3, 1, { top: false }],
                [3, 2, { top: false }],
              ],
            },
          ],
        },
        {
          round: {
            category: CategoryName.Veteran,
            sex: Sex.Male,
            type: CompetitionRoundType.SEMI_FINAL,
            rankingType: BoulderingRoundRankingType.CIRCUIT,
            groups: 1,
            boulders: 1,
          },
          groups: [
            {
              results: [
                [0, 0, { top: true, zone: true, try: 1 }],
                [1, 0, { top: true, zone: true, try: 2 }],
                [2, 0, { top: true, zone: true, try: 1 }],
              ],
            },
          ],
        },
        {
          round: {
            category: CategoryName.Veteran,
            sex: Sex.Male,
            type: CompetitionRoundType.FINAL,
            rankingType: BoulderingRoundRankingType.CIRCUIT,
            groups: 1,
            boulders: 1,
          },
          groups: [
            {
              results: [
                [0, 0, { top: true, zone: true, try: 1 }],
                [1, 0, { top: true, zone: true, try: 2 }],
                [2, 0, { top: false, zone: true, try: 1 }],
              ],
            },
          ],
        },
      ],
    ],
    [
      'Three circuits',
      [
        {
          firstName: 'Gautier',
          lastName: 'Supper',
          club: 'Supper Club',
          birthYear: 1950,
          sex: Sex.Male,
        },
        {
          firstName: 'Gautier2',
          lastName: 'Supper',
          club: 'Supper Club',
          birthYear: 1950,
          sex: Sex.Male,
        },
        {
          firstName: 'Gautier3',
          lastName: 'Supper',
          club: 'Supper Club',
          birthYear: 1950,
          sex: Sex.Male,
        },
        {
          firstName: 'Gautier4',
          lastName: 'Supper',
          club: 'Supper Club',
          birthYear: 1950,
          sex: Sex.Male,
        },
      ],
      [
        {
          round: {
            category: CategoryName.Veteran,
            sex: Sex.Male,
            type: CompetitionRoundType.QUALIFIER,
            rankingType: BoulderingRoundRankingType.CIRCUIT,
            groups: 1,
            boulders: 1,
          },
          groups: [
            {
              results: [
                [0, 0, { top: true, zone: true, try: 1 }],
                [1, 0, { top: false, zone: false, try: 2 }],
                [2, 0, { top: true, zone: true, try: 1 }],
              ],
            },
          ],
        },
        {
          round: {
            category: CategoryName.Veteran,
            sex: Sex.Male,
            type: CompetitionRoundType.SEMI_FINAL,
            rankingType: BoulderingRoundRankingType.CIRCUIT,
            groups: 1,
            boulders: 1,
          },
          groups: [
            {
              results: [
                [0, 0, { top: true, zone: true, try: 1 }],
                [1, 0, { top: true, zone: true, try: 2 }],
                [2, 0, { top: true, zone: true, try: 1 }],
              ],
            },
          ],
        },
        {
          round: {
            category: CategoryName.Veteran,
            sex: Sex.Male,
            type: CompetitionRoundType.FINAL,
            rankingType: BoulderingRoundRankingType.CIRCUIT,
            groups: 1,
            boulders: 1,
          },
          groups: [
            {
              results: [
                [0, 0, { top: true, zone: true, try: 1 }],
                [1, 0, { top: true, zone: true, try: 2 }],
                [2, 0, { top: false, zone: true, try: 1 }],
              ],
            },
          ],
        },
      ],
    ],
  ])('%s', async function (testName, climbers, roundsData) {
    const competition = await givenReadyCompetition();
    const registeredClimbers: User[] = [];

    for (const climberData of climbers) {
      const { user: climber } = await utils.givenUser(climberData);
      await utils.registerUserInCompetition(climber, competition);
      registeredClimbers.push(climber);
    }

    for (const roundData of roundsData) {
      const round = await utils.addBoulderingRound(
        competition,
        roundData.round,
      );

      if (round.type === CompetitionRoundType.QUALIFIER) {
        await utils.startQualifiers(competition);
      } else if (round.type === CompetitionRoundType.SEMI_FINAL) {
        await utils.startSemiFinals(competition);
      } else if (round.type === CompetitionRoundType.FINAL) {
        await utils.startFinals(competition);
      }

      for (let i = 0; i < roundData.groups.length; i++) {
        const group = round.groups[i];
        const groupData = roundData.groups[i];

        for (const [
          climberIndex,
          boulderIndex,
          resultData,
        ] of groupData.results) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const climber = registeredClimbers[climberIndex];

          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const boulder = group.boulders[boulderIndex];

          await utils.addBoulderingResult(
            competition,
            round,
            group,
            boulder,
            climber,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            resultData,
          );
        }
      }
    }

    const res = await api
      .get(`/competitions/${competition.id}/rankings/pdf`)
      .expect(200);

    await snapshot(res.body, testName);
  });
});
