import { Injectable, NotImplementedException } from '@nestjs/common';
import { Competition } from '../competition/competition.entity';
import * as path from 'path';
import * as fs from 'fs';
import { Category } from '../shared/types/category.interface';
import { Sex } from '../shared/types/sex.enum';
import { CategoryName } from '../shared/types/category-name.enum';
import PdfPrinter from 'pdfmake';
import { Column, Content, TableCell } from 'pdfmake/interfaces';
import { ClimberRankingInfos } from '../competition/types/climber-ranking-infos.interface';
import { name, version } from '../../package.json';
import {
  BoulderingCircuitRanking,
  BoulderingLimitedContestRanking,
  BoulderingUnlimitedContestRanking,
  BoulderingUnlimitedContestRankings,
} from '../bouldering/group/bouldering-group.entity';
import {
  BoulderingRound,
  BoulderingRoundRankingType,
  BoulderingRoundUnlimitedContestRankings,
} from '../bouldering/round/bouldering-round.entity';

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

  private getPrintableSchedule(date: Date) {
    return `${this.addForwardZero(date.getHours())}h${this.addForwardZero(
      date.getMinutes(),
    )}`;
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

  private sortRankings<T extends { ranking: number }>(rankings: T[]): T[] {
    return rankings.sort((a, b) => a.ranking - b.ranking);
  }

  private getCategoryStyleKey(category: Category): string {
    return `${category.name}.${category.sex}`;
  }

  private getLogoId(category: Category): string {
    return `logo.${this.getCategoryStyleKey(category)}`;
  }

  private getFontSizeForColumns(columns: number): number {
    if (columns > 3) {
      return 6.25;
    } else if (columns > 2) {
      return 8.25;
    } else {
      return 11.5;
    }
  }

  private getColumnGapForColumns(columns: number): number {
    if (columns > 3) {
      return 10;
    } else if (columns > 2) {
      return 20;
    } else {
      return 30;
    }
  }

  private printHeader(
    content: Content[],
    category: Category,
    competition: Competition,
  ): void {
    content.push(
      {
        id: this.getLogoId(category),
        svg: this.LOGO,
        absolutePosition: {
          x: 10,
          y: 20,
        },
        width: 85,
        pageOrientation:
          competition.getQualifierRound(category)?.rankingType ===
          BoulderingRoundRankingType.UNLIMITED_CONTEST
            ? 'landscape'
            : 'portrait',
      },
      {
        style: 'header',
        margin: [0, 10, 0, 0],
        text: competition.name,
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
    rankings: BoulderingRoundUnlimitedContestRankings,
    style: string,
  ): Column {
    const boulders = round.groups[0].boulders
      .getItems()
      .sort((a, b) => a.index - b.index);

    const bouldersCount = boulders.length;
    const totalColumns = bouldersCount + 3;

    const bouldersPoints = (round.groups[0]
      .rankings as BoulderingUnlimitedContestRankings).bouldersPoints;

    return {
      style,
      width: 'auto',
      table: {
        widths: new Array(totalColumns).fill('auto'),
        body: [
          [
            {
              text: round.type,
              fillColor: 'silver',
              bold: true,
              colSpan: totalColumns,
            },
            ...new Array(totalColumns - 1).fill({
              text: '',
            }),
          ],
          [
            {
              text: `Quota ${round.quota}`,
              bold: true,
              colSpan: totalColumns,
            },
            ...new Array(totalColumns - 1).fill({
              text: '',
            }),
          ],
          [
            ...bouldersPoints.map((points) => ({
              text: `${points}`,
              alignment: 'right',
            })),
            {
              text: 'Total',
              fillColor: 'silver',
              bold: true,
              colSpan: 3,
            },
            ...new Array(3).fill({
              text: '',
            }),
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
          ...rankings.rankings.map((ranking): Column[] => [
            ...ranking.tops.map(
              (top): Column => ({
                text: top ? 'O' : '',
              }),
            ),
            {
              text: `${ranking.nbTops}`,
            },
            {
              text: `${ranking.points}`,
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
    style: string,
  ): Column {
    return this.getBoulderingLimitedContestTable(round, rankings, style);
  }

  private getBoulderingLimitedContestTable(
    round: BoulderingRound,
    rankings: BoulderingLimitedContestRanking[],
    style: string,
  ): Column {
    return {
      style,
      width: 'auto',
      table: {
        widths: ['auto', 'auto', 'auto', 'auto', 'auto'],
        body: [
          [
            {
              text: round.type,
              fillColor: 'silver',
              colSpan: 5,
              bold: true,
            },
            {
              text: '',
            },
            {
              text: '',
            },
            {
              text: '',
            },
            {
              text: '',
            },
          ],
          [
            {
              text: `Quota ${round.quota}`,
              colSpan: 5,
              bold: true,
            },
            {
              text: '',
            },
            {
              text: '',
            },
            {
              text: '',
            },
            {
              text: '',
            },
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

  private printTable(
    content: Content[],
    category: Category,
    competition: Competition,
  ) {
    const style = this.getCategoryStyleKey(category);
    const sortedRankings = this.sortRankings(
      competition.rankings[category.name]![category.sex]!,
    );

    const getBlankLine = () => [
      {
        text: ' ',
        colSpan: 3,
        border: [false, false, false, false],
      },
      {
        text: '',
      },
      {
        text: '',
      },
    ];

    const mainColumn: Column = {
      style,
      width: 'auto',
      margin: [10, 0, 0, 0],
      table: {
        widths: ['auto', 'auto', 'auto'],
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

    const roundsColumns = competition
      .getCategoryRounds(category)
      .filter((round) => typeof round.rankings !== 'undefined')
      .map(
        (round): Column => {
          const rankings = round.rankings!;

          if (rankings.type === BoulderingRoundRankingType.UNLIMITED_CONTEST) {
            rankings.rankings = this.sortRankings(rankings.rankings);

            return this.getBoulderingUnlimitedContestTable(
              round,
              rankings,
              style,
            );
          }

          if (rankings.type === BoulderingRoundRankingType.LIMITED_CONTEST) {
            return this.getBoulderingLimitedContestTable(
              round,
              this.sortRankings(rankings.rankings),
              style,
            );
          }

          if (rankings.type === BoulderingRoundRankingType.CIRCUIT) {
            return this.getBoulderingCircuitTable(
              round,
              this.sortRankings(rankings.rankings),
              style,
            );
          }

          throw new NotImplementedException('Unhandled ranking type');
        },
      );

    const columns: Column[] = [mainColumn, ...roundsColumns];

    content.push({
      columns,
      columnGap: this.getColumnGapForColumns(columns.length),
      fontSize: this.getFontSizeForColumns(columns.length),
      font: 'arial_narrow',
      bold: false,
      alignment: 'center',
    });
  }

  private printCategoryRankings(
    content: Content[],
    competition: Competition,
    category: Category,
  ) {
    this.printHeader(content, category, competition);
    this.printTable(content, category, competition);
  }

  generateCompetitionPdf(competition: Competition): NodeJS.ReadableStream {
    const content: Content[] = [];
    const creationDate = new Date();

    for (const [categoryName, sexes] of Object.entries(competition.rankings)) {
      if (!sexes) {
        continue;
      }

      for (const [sex, rankings] of Object.entries(sexes)) {
        if (!rankings) {
          continue;
        }

        const category = {
          sex: sex as Sex,
          name: categoryName as CategoryName,
        };

        this.printCategoryRankings(content, competition, category);
      }
    }

    const tag = `${name} v${version}`;

    const doc = this.printer.createPdfKitDocument({
      content,
      pageBreakBefore(currentNode, a, b, previousNodesOnPage): boolean {
        const previousLogo = previousNodesOnPage.find((n) =>
          n.id?.startsWith('logo'),
        );

        return !!(
          currentNode.id &&
          currentNode.id.startsWith('logo') &&
          previousLogo
        );
      },
      footer: (currentPage, pageCount): Content[] => {
        return [
          {
            canvas: [
              {
                type: 'line',
                x1: 30,
                y1: -10,
                x2: 565,
                y2: -10,
                lineWidth: 0.5,
              },
            ],
          },
          {
            style: 'footer',
            text: tag,
            alignment: 'left',
            margin: [30, -6.5, 0, 0],
          },
          {
            style: 'footer',
            text: `Edité le ${this.getPrintableDate(
              creationDate,
            )} à ${this.getPrintableSchedule(creationDate)}`,
            alignment: 'left',
            margin: [30, 0, 0, 0],
          },
          {
            style: 'footer',
            text: `Page n°${currentPage}/${pageCount}`,
            alignment: 'right',
            bold: true,
            margin: [0, -20, 30, 0],
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
      pageOrientation: 'portrait',
      pageMargins: [15, 30, 15, 20],
      info: {
        author: tag,
        creator: tag,
        title: competition.name,
        creationDate,
      },
    });

    doc.end();
    return doc;
  }
}
