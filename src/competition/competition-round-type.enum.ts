export enum CompetitionRoundType {
  QUALIFIER = 'QUALIFIER',
  SEMI_FINAL = 'SEMI_FINAL',
  FINAL = 'FINAL',
}

export const CompetitionRoundTypeOrdering = {
  [CompetitionRoundType.QUALIFIER]: 0,
  [CompetitionRoundType.SEMI_FINAL]: 1,
  [CompetitionRoundType.FINAL]: 2,
};
