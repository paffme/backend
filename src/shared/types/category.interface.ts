import { Sex } from './sex.enum';
import { CategoryName } from './category-name.enum';

export interface Category {
  sex: Sex;
  name: CategoryName;
}
