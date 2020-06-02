import { CompetitionRoundType } from '../src/competition/competition-round-type.enum';

export type RoundQuotaConfigValue = {
  [CompetitionRoundType.QUALIFIER]: number;
  [CompetitionRoundType.SEMI_FINAL]: number;
};

type RoundQuotaMap = Map<number, RoundQuotaConfigValue>;

export const RoundQuotaConfig: RoundQuotaMap = new Map([
  [
    3,
    {
      [CompetitionRoundType.QUALIFIER]: 3,
      [CompetitionRoundType.SEMI_FINAL]: 3,
    },
  ],
  [
    4,
    {
      [CompetitionRoundType.QUALIFIER]: 4,
      [CompetitionRoundType.SEMI_FINAL]: 3,
    },
  ],
  [
    5,
    {
      [CompetitionRoundType.QUALIFIER]: 4,
      [CompetitionRoundType.SEMI_FINAL]: 3,
    },
  ],
  [
    6,
    {
      [CompetitionRoundType.QUALIFIER]: 5,
      [CompetitionRoundType.SEMI_FINAL]: 4,
    },
  ],
  [
    7,
    {
      [CompetitionRoundType.QUALIFIER]: 6,
      [CompetitionRoundType.SEMI_FINAL]: 5,
    },
  ],
  [
    8,
    {
      [CompetitionRoundType.QUALIFIER]: 6,
      [CompetitionRoundType.SEMI_FINAL]: 5,
    },
  ],
  [
    9,
    {
      [CompetitionRoundType.QUALIFIER]: 7,
      [CompetitionRoundType.SEMI_FINAL]: 6,
    },
  ],
  [
    10,
    {
      [CompetitionRoundType.QUALIFIER]: 8,
      [CompetitionRoundType.SEMI_FINAL]: 7,
    },
  ],
  [
    11,
    {
      [CompetitionRoundType.QUALIFIER]: 9,
      [CompetitionRoundType.SEMI_FINAL]: 8,
    },
  ],
  [
    12,
    {
      [CompetitionRoundType.QUALIFIER]: 10,
      [CompetitionRoundType.SEMI_FINAL]: 8,
    },
  ],
  [
    13,
    {
      [CompetitionRoundType.QUALIFIER]: 11,
      [CompetitionRoundType.SEMI_FINAL]: 8,
    },
  ],
  [
    14,
    {
      [CompetitionRoundType.QUALIFIER]: 12,
      [CompetitionRoundType.SEMI_FINAL]: 8,
    },
  ],
  [
    15,
    {
      [CompetitionRoundType.QUALIFIER]: 12,
      [CompetitionRoundType.SEMI_FINAL]: 8,
    },
  ],
  [
    16,
    {
      [CompetitionRoundType.QUALIFIER]: 13,
      [CompetitionRoundType.SEMI_FINAL]: 8,
    },
  ],
  [
    17,
    {
      [CompetitionRoundType.QUALIFIER]: 14,
      [CompetitionRoundType.SEMI_FINAL]: 8,
    },
  ],
  [
    18,
    {
      [CompetitionRoundType.QUALIFIER]: 15,
      [CompetitionRoundType.SEMI_FINAL]: 8,
    },
  ],
  [
    19,
    {
      [CompetitionRoundType.QUALIFIER]: 16,
      [CompetitionRoundType.SEMI_FINAL]: 8,
    },
  ],
  [
    20,
    {
      [CompetitionRoundType.QUALIFIER]: 16,
      [CompetitionRoundType.SEMI_FINAL]: 8,
    },
  ],
  [
    21,
    {
      [CompetitionRoundType.QUALIFIER]: 17,
      [CompetitionRoundType.SEMI_FINAL]: 8,
    },
  ],
  [
    22,
    {
      [CompetitionRoundType.QUALIFIER]: 18,
      [CompetitionRoundType.SEMI_FINAL]: 8,
    },
  ],
  [
    23,
    {
      [CompetitionRoundType.QUALIFIER]: 19,
      [CompetitionRoundType.SEMI_FINAL]: 8,
    },
  ],
  [
    24,
    {
      [CompetitionRoundType.QUALIFIER]: 20,
      [CompetitionRoundType.SEMI_FINAL]: 8,
    },
  ],
  [
    25,
    {
      [CompetitionRoundType.QUALIFIER]: 21,
      [CompetitionRoundType.SEMI_FINAL]: 8,
    },
  ],
  [
    26,
    {
      [CompetitionRoundType.QUALIFIER]: 22,
      [CompetitionRoundType.SEMI_FINAL]: 8,
    },
  ],
  [
    27,
    {
      [CompetitionRoundType.QUALIFIER]: 23,
      [CompetitionRoundType.SEMI_FINAL]: 8,
    },
  ],
  [
    28,
    {
      [CompetitionRoundType.QUALIFIER]: 24,
      [CompetitionRoundType.SEMI_FINAL]: 8,
    },
  ],
  [
    29,
    {
      [CompetitionRoundType.QUALIFIER]: 25,
      [CompetitionRoundType.SEMI_FINAL]: 8,
    },
  ],
  [
    30,
    {
      [CompetitionRoundType.QUALIFIER]: 26,
      [CompetitionRoundType.SEMI_FINAL]: 8,
    },
  ],
]);
