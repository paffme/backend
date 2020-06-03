import { BoulderingRoundRankingType } from '../../../src/bouldering/round/bouldering-round.entity';
import { givenBoulderingRound } from '../../fixture/bouldering-round.fixture';
import { BoulderingGroupState } from '../../../src/bouldering/group/bouldering-group.entity';

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

  it('takes new climbers in pending state', () => {
    const round = givenBoulderingRound();
    round.groups.getItems()[0].state = BoulderingGroupState.PENDING;
    expect(round.takesNewClimbers()).toEqual(true);
  });

  it('takes new climbers in ongoing state', () => {
    const round = givenBoulderingRound();
    round.groups.getItems()[0].state = BoulderingGroupState.ONGOING;
    expect(round.takesNewClimbers()).toEqual(true);
  });

  it('does not takes new climbers in ended state', () => {
    const round = givenBoulderingRound();
    round.groups.getItems()[0].state = BoulderingGroupState.ENDED;
    expect(round.takesNewClimbers()).toEqual(false);
  });
});
