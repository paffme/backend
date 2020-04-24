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

  it('gets season when the start date is on the first part of a season', () => {
    expect(
      givenCompetition({
        startDate: new Date(2019, 8, 1),
      }).getSeason(),
    ).toEqual(2019);
  });

  it('gets season when the start date is on the second part of a season', () => {
    expect(
      givenCompetition({
        startDate: new Date(2020, 0, 1),
      }).getSeason(),
    ).toEqual(2019);
  });
});
