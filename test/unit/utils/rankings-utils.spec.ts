import { getRankingDiff } from '../../../src/bouldering/ranking/ranking.utils';

describe('Rankings utils (unit)', () => {
  it('gets rankings diff with a new climber', () => {
    const diff = getRankingDiff(
      [],
      [
        {
          climberId: 1,
          ranking: 1,
        },
      ],
    );

    expect(diff).toHaveLength(1);
    expect(diff[0]).toEqual({
      climberId: 1,
      added: true,
    });
  });

  it('gets rankings diff with a removed climber', () => {
    const diff = getRankingDiff(
      [
        {
          climberId: 1,
          ranking: 1,
        },
      ],
      [],
    );

    expect(diff).toHaveLength(1);
    expect(diff[0]).toEqual({
      climberId: 1,
      removed: true,
    });
  });

  it('gets rankings diff with a negative ranking delta', () => {
    const diff = getRankingDiff(
      [
        {
          climberId: 1,
          ranking: 1,
        },
      ],
      [
        {
          climberId: 1,
          ranking: 2,
        },
      ],
    );

    expect(diff).toHaveLength(1);
    expect(diff[0]).toEqual({
      climberId: 1,
      delta: -1,
    });
  });

  it('gets rankings diff with a positive ranking delta', () => {
    const diff = getRankingDiff(
      [
        {
          climberId: 1,
          ranking: 2,
        },
      ],
      [
        {
          climberId: 1,
          ranking: 1,
        },
      ],
    );

    expect(diff).toHaveLength(1);
    expect(diff[0]).toEqual({
      climberId: 1,
      delta: 1,
    });
  });

  it('gets rankings diff with many climbers', () => {
    const diff = getRankingDiff(
      [
        {
          climberId: 1,
          ranking: 2,
        },
        {
          climberId: 2,
          ranking: 1,
        },
      ],
      [
        {
          climberId: 2,
          ranking: 1,
        },
        {
          climberId: 3,
          ranking: 1,
        },
      ],
    );

    expect(diff).toHaveLength(3);

    expect(diff[0]).toEqual({
      climberId: 1,
      removed: true,
    });

    expect(diff[1]).toEqual({
      climberId: 2,
      delta: 0,
    });

    expect(diff[2]).toEqual({
      climberId: 3,
      added: true,
    });
  });
});
