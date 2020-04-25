import { givenUser } from '../../fixture/user.fixture';
import { CategoryName } from '../../../src/shared/types/category-name.enum';
import { InternalServerErrorException } from '@nestjs/common';
import { Sex } from '../../../src/shared/types/sex.enum';

describe('User entity (unit)', () => {
  it('gets category name for a veteran', () => {
    const season = 2019;

    const user = givenUser({
      birthYear: 1979,
    });

    expect(user.getCategory(season).name).toEqual(CategoryName.Veteran);
  });

  it('gets category name for a senior', () => {
    const season = 2019;

    const user = givenUser({
      birthYear: 2000,
    });

    expect(user.getCategory(season).name).toEqual(CategoryName.Senior);
  });

  it('gets category name for a junior', () => {
    const season = 2019;

    const user = givenUser({
      birthYear: 2002,
    });

    expect(user.getCategory(season).name).toEqual(CategoryName.Junior);
  });

  it('gets category name for a cadet', () => {
    const season = 2019;

    const user = givenUser({
      birthYear: 2004,
    });

    expect(user.getCategory(season).name).toEqual(CategoryName.Cadet);
  });

  it('gets category name for a minime', () => {
    const season = 2019;

    const user = givenUser({
      birthYear: 2006,
    });

    expect(user.getCategory(season).name).toEqual(CategoryName.Minime);
  });

  it('gets category name for a benjamin', () => {
    const season = 2019;

    const user = givenUser({
      birthYear: 2008,
    });

    expect(user.getCategory(season).name).toEqual(CategoryName.Benjamin);
  });

  it('gets category name for a poussin', () => {
    const season = 2019;

    const user = givenUser({
      birthYear: 2010,
    });

    expect(user.getCategory(season).name).toEqual(CategoryName.Poussin);
  });

  it('gets category name for a microbe', () => {
    const season = 2019;

    const user = givenUser({
      birthYear: 2012,
    });

    expect(user.getCategory(season).name).toEqual(CategoryName.Microbe);
  });

  it('throws when getting category name for a too young climber', () => {
    const season = 2019;

    const user = givenUser({
      birthYear: 2014,
    });

    expect(() => user.getCategory(season)).toThrow(
      InternalServerErrorException,
    );
  });

  it('gets sex when female', () => {
    expect(
      givenUser({
        sex: Sex.Female,
      }).getCategory(2020).sex,
    ).toEqual(Sex.Female);
  });

  it('gets sex when male', () => {
    expect(
      givenUser({
        sex: Sex.Male,
      }).getCategory(2020).sex,
    ).toEqual(Sex.Male);
  });
});
