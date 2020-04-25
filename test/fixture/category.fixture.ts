import { Category } from '../../src/shared/types/category.interface';
import { Sex } from '../../src/shared/types/sex.enum';
import { CategoryName } from '../../src/shared/types/category-name.enum';

export function givenCategory(data?: Partial<Category>): Category {
  return {
    sex: data?.sex ?? Sex.Female,
    name: data?.name ?? CategoryName.Minime,
  };
}
