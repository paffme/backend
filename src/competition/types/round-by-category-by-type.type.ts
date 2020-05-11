import { CategoryName } from '../../shared/types/category-name.enum';
import { Sex } from '../../shared/types/sex.enum';
import { CompetitionRoundType } from '../competition-round-type.enum';

export type RoundByType<T> = {
  [type in CompetitionRoundType]?: T;
};

export type RoundBySex<T> = {
  [sex in Sex]?: RoundByType<T>;
};

export type RoundByCategoryByType<T> = {
  [categoryName in CategoryName]?: RoundBySex<T>;
};
