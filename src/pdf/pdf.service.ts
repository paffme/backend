import {
  Injectable,
  InternalServerErrorException,
  NotImplementedException,
} from '@nestjs/common';
import { Competition } from '../competition/competition.entity';
import * as path from 'path';
import * as fs from 'fs';
import { Category } from '../shared/types/category.interface';
import { Sex } from '../shared/types/sex.enum';
import { CategoryName } from '../shared/types/category-name.enum';
import PdfPrinter from 'pdfmake';
import { Column, Content, ContentTable, TableCell } from 'pdfmake/interfaces';
import { ClimberRankingInfos } from '../competition/types/climber-ranking-infos.interface';
import { name, version } from '../../package.json';
import {
  BoulderingCircuitRanking,
  BoulderingGroup,
  BoulderingGroupRankingsStandalone,
  BoulderingLimitedContestRanking,
  BoulderingUnlimitedContestRanking,
  BoulderingUnlimitedContestRankings,
} from '../bouldering/group/bouldering-group.entity';
import {
  BoulderingRound,
  BoulderingRoundRankingsStandalone,
  BoulderingRoundRankingType,
} from '../bouldering/round/bouldering-round.entity';
import { RankingsNotFoundError } from '../competition/errors/rankings-not-found.error';
import { RankingsMap } from '../bouldering/types/rankings-map';
import * as uuid from 'uuid';
import { isDefined, isNil } from '../shared/utils/objects.helper';

/* eslint-disable sonarjs/no-duplicate-string */

type PdfRanking = { ranking: number; climber: ClimberRankingInfos };

@Injectable()
export class PdfService {
  private readonly fonts = {
    clan_ot: {
      bold: path.join(__dirname, '../../assets/fonts/ClanOT-Black.otf'),
    },
    arial_narrow: {
      normal: path.join(__dirname, '../../assets/fonts/ArialNarrow.ttf'),
      bold: path.join(__dirname, '../../assets/fonts/ArialNarrowBold.ttf'),
    },
    times_new_roman: {
      normal: path.join(__dirname, '../../assets/fonts/TimesNewRoman.ttf'),
      bold: path.join(__dirname, '../../assets/fonts/TimesNewRomanBold.ttf'),
    },
  };

  private readonly printer = new PdfPrinter(this.fonts);

  private readonly categoryNamePrintMapping: Record<CategoryName, string> = {
    [CategoryName.Microbe]: 'Microbes',
    [CategoryName.Poussin]: 'Poussins',
    [CategoryName.Benjamin]: 'Benjamins',
    [CategoryName.Minime]: 'Minimes',
    [CategoryName.Cadet]: 'Cadets',
    [CategoryName.Junior]: 'Juniors',
    [CategoryName.Senior]: 'Seniors',
    [CategoryName.Veteran]: 'Vétérans',
  };

  private readonly sexPrintMapping: Record<Sex, string> = {
    [Sex.Female]: 'Dames',
    [Sex.Male]: 'Hommes',
  };

  private readonly LOGO = fs
    .readFileSync(path.resolve(path.join(__dirname, '../../assets/ffme.svg')))
    .toString();

  private addForwardZero(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
  }

  private getPrintableDate(date: Date) {
    return `${this.addForwardZero(date.getDate())}/${this.addForwardZero(
      date.getMonth() + 1,
    )}/${date.getFullYear()}`;
  }

  private getPrintableCategoryName(categoryName: CategoryName): string {
    return this.categoryNamePrintMapping[categoryName].toUpperCase();
  }

  private getPrintableSex(sex: Sex): string {
    return this.sexPrintMapping[sex];
  }

  private getFullName(climber: ClimberRankingInfos): string {
    return `${climber.lastName.toUpperCase()} ${climber.firstName}`.substring(
      0,
      32,
    );
  }

  private getClub(climber: ClimberRankingInfos): string {
    return `${climber.club.toUpperCase()}`.substring(0, 23);
  }

  private sumBooleans<T extends boolean>(array: T[]): number {
    return array.reduce((acc, el) => acc + Number(el), 0);
  }

  private sumNumbers<T extends number>(array: T[]): number {
    return array.reduce((acc, el) => acc + el, 0);
  }

  private sortRankings<T extends PdfRanking>(
    rankings: T[],
    nextRoundRankings?: RankingsMap,
  ): T[] {
    const [
      climbersRankingsInNextRound,
      remainingClimbersRankings,
    ] = rankings.reduce<[T[], T[]]>(
      (pair, r) => {
        const [inNextRound, remaining] = pair;

        if (nextRoundRankings?.has(r.climber.id)) {
          inNextRound.push(r);
        } else {
          remaining.push(r);
        }

        return pair;
      },
      [[], []],
    );

    return [
      ...climbersRankingsInNextRound.sort((a, b) => a.ranking - b.ranking),
      ...remainingClimbersRankings.sort((a, b) => a.ranking - b.ranking),
    ];
  }

  private getLogoId(): string {
    return `logo.${uuid.v4()}`;
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  private getFontSizeAndColumnGap(
    columns: number,
    columnsSize: number[],
    isLandscape: boolean,
  ): [number, number] {
    // unlimited contest
    if (isLandscape) {
      if (columns === 2) {
        if (columnsSize[1] > 30) {
          return [5, 5];
        } else if (columnsSize[1] > 25) {
          return [6, 5];
        } else if (columnsSize[1] > 20) {
          return [7, 5];
        } else if (columnsSize[1] > 15) {
          return [8, 10];
        } else if (columnsSize[1] > 10) {
          return [11.5, 20];
        } else if (columnsSize[1] > 5) {
          return [14, 30];
        } else {
          return [15, 35];
        }
      } else if (columns === 3) {
        if (columnsSize[1] > 30) {
          return [4, 5];
        } else if (columnsSize[1] > 25) {
          return [4.7, 5];
        } else if (columnsSize[1] > 20) {
          return [6, 5];
        } else if (columnsSize[1] > 15) {
          return [7.25, 10];
        } else if (columnsSize[1] > 10) {
          return [9, 15];
        } else if (columnsSize[1] > 5) {
          return [11, 20];
        } else {
          return [14, 25];
        }
      } else if (columns === 4) {
        if (columnsSize[1] > 30) {
          return [3.25, 5];
        } else if (columnsSize[1] > 25) {
          return [3.9, 5];
        } else if (columnsSize[1] > 20) {
          return [4.8, 5];
        } else if (columnsSize[1] > 15) {
          return [5.75, 5];
        } else if (columnsSize[1] > 10) {
          return [7, 10];
        } else if (columnsSize[1] > 5) {
          return [8.5, 15];
        } else {
          return [10, 20];
        }
      } else {
        throw new NotImplementedException('Unhandled columns length');
      }
    }

    if (columns === 4) {
      return [6.25, 10];
    } else if (columns === 3) {
      return [8.25, 20];
    } else if (columns === 2) {
      return [11.5, 30];
    } else {
      throw new NotImplementedException('Unhandled columns length');
    }
  }

  private getRoundRankingsMap(
    round?: BoulderingRound,
  ): RankingsMap | undefined {
    if (isDefined(round) && isDefined(round.rankings)) {
      return (round.rankings
        .rankings as BoulderingRoundRankingsStandalone).reduce(
        (map, ranking) => {
          map.set(ranking.climber.id, ranking.ranking);
          return map;
        },
        new Map(),
      );
    }
  }

  private printHeader(
    content: Content[],
    title: string,
    category: Category,
    competition: Competition,
  ): void {
    content.push(
      {
        id: this.getLogoId(),
        svg: this.LOGO,
        absolutePosition: {
          x: 10,
          y: 20,
        },
        width: 85,
      },
      {
        style: 'header',
        margin: [0, 10, 0, 0],
        text: title,
      },
      {
        style: 'header',
        text: `Du ${this.getPrintableDate(
          competition.startDate,
        )} au ${this.getPrintableDate(
          competition.endDate,
        )} à ${competition.city.toUpperCase()}`,
      },
      {
        style: 'header',
        text: `Résultats ${this.getPrintableCategoryName(
          category.name,
        )} - ${this.getPrintableSex(category.sex)}`,
        margin: [0, 0, 0, 50],
      },
    );
  }

  private getBoulderingUnlimitedContestTable(
    round: BoulderingRound,
    rankings: BoulderingUnlimitedContestRanking[],
  ): Column {
    const boulders = round.groups[0].boulders
      .getItems()
      .sort((a, b) => a.index - b.index);

    const bouldersCount = boulders.length;
    const totalColumns = bouldersCount + 3;

    const bouldersPoints = (round.groups[0]
      .rankings as BoulderingUnlimitedContestRankings).bouldersPoints;

    return {
      width: 'auto',
      table: {
        widths: new Array(totalColumns).fill('auto'),
        headerRows: 4,
        body: [
          [
            {
              text: round.type,
              fillColor: 'silver',
              bold: true,
              colSpan: totalColumns,
            },
            ...new Array(totalColumns - 1).fill(''),
          ],
          [
            {
              text: `Quota ${round.quota}`,
              bold: true,
              colSpan: totalColumns,
            },
            ...new Array(totalColumns - 1).fill(''),
          ],
          [
            ...bouldersPoints.map((points) => ({
              text: points.toFixed(2),
              alignment: 'right',
            })),
            {
              text: 'Total',
              fillColor: 'silver',
              bold: true,
              colSpan: totalColumns - bouldersCount,
            },
            ...new Array(totalColumns - bouldersCount - 1).fill(''),
          ],
          [
            ...boulders.map((boulder) => ({
              text: `${boulder.index}`,
              fillColor: 'silver',
              bold: true,
            })),
            {
              text: 'Ré',
              fillColor: 'silver',
              bold: true,
            },
            {
              text: 'Perf',
              fillColor: 'silver',
              bold: true,
            },
            {
              text: 'Cl.',
              fillColor: 'silver',
              bold: true,
            },
          ],
          ...rankings.map((ranking): Column[] => [
            ...ranking.tops.map(
              (top): Column => ({
                text: top ? 'O' : ' ',
              }),
            ),
            {
              text: `${ranking.nbTops}`,
            },
            {
              text: ranking.points.toFixed(2),
            },
            {
              text: `${ranking.ranking}`,
            },
          ]),
        ],
      },
    };
  }

  private getBoulderingCircuitTable(
    round: BoulderingRound,
    rankings: BoulderingCircuitRanking[],
  ): Column {
    return this.getBoulderingLimitedContestTable(round, rankings);
  }

  private getBoulderingLimitedContestTable(
    round: BoulderingRound,
    rankings: BoulderingLimitedContestRanking[],
  ): Column {
    return {
      width: 'auto',
      table: {
        widths: ['auto', 'auto', 'auto', 'auto', 'auto'],
        headerRows: 4,
        body: [
          [
            {
              text: round.type,
              fillColor: 'silver',
              colSpan: 5,
              bold: true,
            },
            ...new Array(4).fill(''),
          ],
          [
            {
              text: `Quota ${round.quota}`,
              colSpan: 5,
              bold: true,
            },
            ...new Array(4).fill(''),
          ],
          [
            {
              text: 'Bloc',
              fillColor: 'silver',
              colSpan: 2,
              bold: true,
            },
            {
              text: '',
            },
            {
              text: 'Bonus',
              fillColor: 'silver',
              colSpan: 2,
              bold: true,
            },
            {
              text: '',
            },
            {
              text: '',
              fillColor: 'silver',
            },
          ],
          [
            {
              text: 'Total',
              fillColor: 'silver',
              bold: true,
            },
            {
              text: 'Essai',
              fillColor: 'silver',
              bold: true,
            },
            {
              text: 'Total',
              fillColor: 'silver',
              bold: true,
            },
            {
              text: 'Essai',
              fillColor: 'silver',
              bold: true,
            },
            {
              text: 'Cl.',
              fillColor: 'silver',
              bold: true,
            },
          ],
          ...rankings.map(
            (
              ranking:
                | BoulderingCircuitRanking
                | BoulderingLimitedContestRanking,
            ): TableCell[] => [
              {
                text: this.sumBooleans(ranking.tops),
              },
              {
                text: this.sumNumbers(ranking.topsInTries),
              },
              {
                text: this.sumBooleans(ranking.zones),
              },
              {
                text: this.sumNumbers(ranking.zonesInTries),
              },
              {
                text: ranking.ranking,
                fillColor: 'silver',
                alignment: 'right',
              },
            ],
          ),
        ],
      },
    };
  }

  private getMainRankingsColumn(sortedRankings: PdfRanking[]): Column {
    const getBlankLine = () => [
      {
        text: ' ',
        colSpan: 3,
        border: [false, false, false, false],
      },
      ...new Array(2).fill(''),
    ];

    return {
      width: 'auto',
      margin: [10, 0, 0, 0],
      table: {
        widths: new Array(3).fill('auto'),
        body: [
          getBlankLine(),
          getBlankLine(),
          getBlankLine(),
          [
            {
              text: 'Place',
              alignment: 'center',
              fillColor: 'silver',
              bold: true,
            },
            {
              text: 'Identité',
              alignment: 'center',
              fillColor: 'silver',
              bold: true,
            },
            {
              text: 'Club',
              alignment: 'center',
              fillColor: 'silver',
              bold: true,
            },
          ],
          ...sortedRankings.map((r) => [
            {
              text: r.ranking,
              alignment: 'center',
              bold: true,
            },
            {
              text: this.getFullName(r.climber),
              alignment: 'left',
            },
            {
              text: this.getClub(r.climber),
              alignment: 'left',
            },
          ]),
        ],
      },
    };
  }

  private getGroupRankingsColumn(group: BoulderingGroup): Column {
    const round = group.round;
    const roundRankings = round.rankings;

    if (isNil(roundRankings)) {
      throw new InternalServerErrorException('No round rankings');
    }

    if (roundRankings.type === BoulderingRoundRankingType.UNLIMITED_CONTEST) {
      const sortedRankings = this.sortRankings(roundRankings.rankings);

      return this.getBoulderingUnlimitedContestTable(
        group.round,
        sortedRankings,
      );
    }

    if (roundRankings.type === BoulderingRoundRankingType.LIMITED_CONTEST) {
      const sortedRankings = this.sortRankings(roundRankings.rankings);
      return this.getBoulderingLimitedContestTable(group.round, sortedRankings);
    }

    if (roundRankings.type === BoulderingRoundRankingType.CIRCUIT) {
      const sortedRankings = this.sortRankings(roundRankings.rankings);
      return this.getBoulderingCircuitTable(group.round, sortedRankings);
    }

    throw new NotImplementedException('Unhandled ranking type');
  }

  private getRoundRankingsColumn(round: BoulderingRound): Column {
    const rankings = round.rankings;

    if (isNil(rankings)) {
      throw new InternalServerErrorException('No round rankings');
    }

    const nextRound = round.competition.getNextRound(round);
    const nextRoundRankingsMap = this.getRoundRankingsMap(nextRound);

    if (rankings.type === BoulderingRoundRankingType.UNLIMITED_CONTEST) {
      const sortedRankings = this.sortRankings(
        rankings.rankings,
        nextRoundRankingsMap,
      );

      return this.getBoulderingUnlimitedContestTable(round, sortedRankings);
    }

    if (rankings.type === BoulderingRoundRankingType.LIMITED_CONTEST) {
      return this.getBoulderingLimitedContestTable(
        round,
        this.sortRankings(rankings.rankings, nextRoundRankingsMap),
      );
    }

    if (rankings.type === BoulderingRoundRankingType.CIRCUIT) {
      return this.getBoulderingCircuitTable(
        round,
        this.sortRankings(rankings.rankings, nextRoundRankingsMap),
      );
    }

    throw new NotImplementedException('Unhandled ranking type');
  }

  private printTable(
    content: Content[],
    columns: Column[],
    isLandscape: boolean,
  ) {
    const columnsSize = columns.map(
      (c) => (c as ContentTable).table.widths!.length,
    );

    const [fontSize, columnGap] = this.getFontSizeAndColumnGap(
      columns.length,
      columnsSize,
      isLandscape,
    );

    content.push({
      columns,
      columnGap,
      fontSize,
      font: 'arial_narrow',
      bold: false,
      alignment: 'center',
    });
  }

  private getCategoryRoundsRankingsColumns(
    category: Category,
    competition: Competition,
  ): Column[] {
    const competitionRankings = competition.rankings;

    if (isNil(competitionRankings)) {
      throw new InternalServerErrorException('No competition rankings');
    }

    const categoryNameRankings = competitionRankings[category.name];

    if (isNil(categoryNameRankings)) {
      throw new InternalServerErrorException('No category name rankings');
    }

    const categoryRankings = categoryNameRankings[category.sex];

    if (isNil(categoryRankings)) {
      throw new InternalServerErrorException('No category rankings');
    }

    const sortedMainRankings = this.sortRankings(categoryRankings);
    const mainColumn = this.getMainRankingsColumn(sortedMainRankings);

    const categoryRounds = competition
      .getCategoryRounds(category)
      .filter((round) => !!round.rankings);

    const roundsColumns = categoryRounds.map((round) =>
      this.getRoundRankingsColumn(round),
    );

    return [mainColumn, ...roundsColumns];
  }

  private getRoundRankingsColumns(round: BoulderingRound): Column[] {
    const roundRankings = round.rankings;

    if (isNil(roundRankings)) {
      throw new InternalServerErrorException('No round rankings');
    }

    const sortedRankings = this.sortRankings(
      roundRankings.rankings as BoulderingRoundRankingsStandalone,
    );

    const mainColumn = this.getMainRankingsColumn(sortedRankings);
    const roundColumn = this.getRoundRankingsColumn(round);
    return [mainColumn, roundColumn];
  }

  private getGroupRankingsColumns(group: BoulderingGroup): Column[] {
    const groupRankings = group.rankings;

    if (isNil(groupRankings)) {
      throw new NotImplementedException('No group rankings');
    }

    const sortedRankings = this.sortRankings(
      groupRankings.rankings as BoulderingGroupRankingsStandalone,
    );

    const mainColumn = this.getMainRankingsColumn(sortedRankings);
    const groupColumn = this.getGroupRankingsColumn(group);
    return [mainColumn, groupColumn];
  }

  private printCategoryRankings(
    content: Content[],
    title: string,
    competition: Competition,
    category: Category,
    columns: Column[],
    isLandscape: boolean,
  ): void {
    this.printHeader(content, title, category, competition);
    this.printTable(content, columns, isLandscape);
  }

  private build(
    content: Content[],
    isLandscape: boolean,
    title: string,
  ): NodeJS.ReadableStream {
    if (content.length === 0) {
      throw new RankingsNotFoundError();
    }

    const creationDate = new Date();
    const tag = `${name} v${version}`;

    const doc = this.printer.createPdfKitDocument({
      content,
      pageBreakBefore(currentNode, a, b, previousNodes): boolean {
        const hasPreviousLogo = previousNodes.find((n) =>
          n.id?.startsWith('logo'),
        );

        return !!(currentNode.id?.startsWith('logo') && hasPreviousLogo);
      },
      footer: (currentPage, pageCount): Content[] => {
        return [
          {
            canvas: [
              isLandscape
                ? {
                    type: 'line',
                    x1: 30,
                    y1: -5,
                    x2: 815,
                    y2: -5,
                    lineWidth: 0.5,
                  }
                : {
                    type: 'line',
                    x1: 30,
                    y1: -5,
                    x2: 565,
                    y2: -5,
                    lineWidth: 0.5,
                  },
            ],
          },
          {
            style: 'footer',
            text: name,
            alignment: 'left',
            margin: [30, 0, 0, 0],
          },
          {
            style: 'footer',
            text: `Page n°${currentPage}/${pageCount}`,
            alignment: 'right',
            bold: true,
            margin: [0, -10, 30, 0],
          },
        ];
      },
      styles: {
        header: {
          fontSize: 16,
          font: 'clan_ot',
          bold: true,
          alignment: 'center',
          lineHeight: 1.1,
        },
        footer: {
          font: 'times_new_roman',
          fontSize: 8,
          bold: false,
          lineHeight: 1.2,
        },
      },
      defaultStyle: {
        fontSize: 12,
        font: 'clan_ot',
        bold: true,
      },
      pageSize: 'A4',
      pageOrientation: isLandscape ? 'landscape' : 'portrait',
      pageMargins: [15, 30, 15, 20],
      info: {
        author: tag,
        creator: tag,
        title,
        creationDate,
      },
    });

    doc.end();
    return doc;
  }

  generateBoulderingRoundPdf(round: BoulderingRound): NodeJS.ReadableStream {
    if (isNil(round.rankings)) {
      throw new RankingsNotFoundError();
    }

    const content: Content[] = [];

    const isLandscape =
      round.rankingType === BoulderingRoundRankingType.UNLIMITED_CONTEST;

    const columns = this.getRoundRankingsColumns(round);
    const title = `${round.type} - ${round.competition.name}`;

    this.printCategoryRankings(
      content,
      title,
      round.competition,
      {
        name: round.category,
        sex: round.sex,
      },
      columns,
      isLandscape,
    );

    return this.build(content, isLandscape, title);
  }

  generateCompetitionPdf(competition: Competition): NodeJS.ReadableStream {
    const content: Content[] = [];
    const isLandscape = competition.boulderingRounds
      .getItems()
      .some(
        (r) => r.rankingType === BoulderingRoundRankingType.UNLIMITED_CONTEST,
      );

    for (const [categoryName, sexes] of Object.entries(competition.rankings)) {
      if (isNil(sexes)) {
        continue;
      }

      for (const [sex, rankings] of Object.entries(sexes)) {
        if (isNil(rankings)) {
          continue;
        }

        const category = {
          sex: sex as Sex,
          name: categoryName as CategoryName,
        };

        const columns = this.getCategoryRoundsRankingsColumns(
          category,
          competition,
        );

        this.printCategoryRankings(
          content,
          competition.name,
          competition,
          category,
          columns,
          isLandscape,
        );
      }
    }

    return this.build(content, isLandscape, competition.name);
  }

  async generateBoulderingGroupPdf(
    group: BoulderingGroup,
  ): Promise<NodeJS.ReadableStream> {
    const content: Content[] = [];
    const isLandscape =
      group.round.rankingType === BoulderingRoundRankingType.UNLIMITED_CONTEST;

    const groupIndex = group.round.groups
      .getItems()
      .findIndex((g) => g === group);

    const columns = this.getGroupRankingsColumns(group);
    const title = `${group.round.type} - ${group.round.competition.name} - Groupe ${groupIndex}`;

    this.printCategoryRankings(
      content,
      title,
      group.round.competition,
      {
        sex: group.round.sex,
        name: group.round.category,
      },
      columns,
      isLandscape,
    );

    return this.build(content, isLandscape, title);
  }
}
