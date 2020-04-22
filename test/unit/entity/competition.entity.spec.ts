import { givenCompetition } from '../../fixture/competition.fixture';
import { CompetitionState } from '../../../src/competition/competition.entity';

describe('Bouldering round entity (unit)', () => {
  it('takes a registration when the competition is on PENDING state', () => {
    expect(
      givenCompetition({
        state: CompetitionState.PENDING,
      }).takesRegistrations(),
    ).toEqual(true);
  });

  it('takes a registration when the competition is on ONGOING state', () => {
    expect(
      givenCompetition({
        state: CompetitionState.ONGOING,
      }).takesRegistrations(),
    ).toEqual(true);
  });

  it('does not take a registration when the competition is on ENDED state', () => {
    expect(
      givenCompetition({
        state: CompetitionState.ENDED,
      }).takesRegistrations(),
    ).toEqual(false);
  });
});
