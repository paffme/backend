import {
  BoulderingRoundRankingType,
} from '../../../src/bouldering/round/bouldering-round.entity';
import { givenBoulderingRound } from '../../fixture/bouldering-round.fixture';

describe('Bouldering round entity (unit)', () => {
  it('returns correctly competitions with counted tries', () => {
    expect(
      givenBoulderingRound({
        rankingType: BoulderingRoundRankingType.CIRCUIT,
      }).isRankingWithCountedTries(),
    ).toEqual(true);

    expect(
      givenBoulderingRound({
        rankingType: BoulderingRoundRankingType.LIMITED_CONTEST,
      }).isRankingWithCountedTries(),
    ).toEqual(true);

    expect(
      givenBoulderingRound({
        rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
      }).isRankingWithCountedTries(),
    ).toEqual(false);
  });

  it('returns correctly competitions with counted zones', () => {
    expect(
      givenBoulderingRound({
        rankingType: BoulderingRoundRankingType.CIRCUIT,
      }).isRankingWithCountedZones(),
    ).toEqual(true);

    expect(
      givenBoulderingRound({
        rankingType: BoulderingRoundRankingType.LIMITED_CONTEST,
      }).isRankingWithCountedZones(),
    ).toEqual(true);

    expect(
      givenBoulderingRound({
        rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
      }).isRankingWithCountedZones(),
    ).toEqual(false);
  });
});
