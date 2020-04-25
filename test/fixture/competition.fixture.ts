import { Competition } from '../../src/competition/competition.entity';
import { CreateCompetitionDTO } from '../../src/competition/dto/in/body/create-competition.dto';
import * as uuid from 'uuid';
import { Sex } from '../../src/shared/types/sex.enum';
import { CategoryName } from '../../src/shared/types/category-name.enum';
import { CompetitionType } from '../../src/competition/types/competition-type.enum';

export function givenCreateCompetitionDto(
  data?: Partial<CreateCompetitionDTO>,
): CreateCompetitionDTO {
  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );

  const tomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );

  tomorrow.setDate(tomorrow.getDate() + 1);

  return {
    address: data?.address ?? uuid.v4(),
    categories: data?.categories ?? [
      {
        sex: Sex.Male,
        name: CategoryName.Minime,
      },
    ],
    city: data?.city ?? uuid.v4(),
    name: data?.name ?? uuid.v4(),
    postalCode: data?.postalCode ?? uuid.v4(),
    type: data?.type ?? CompetitionType.Lead,
    startDate: data?.startDate ?? today,
    endDate: data?.endDate ?? tomorrow,
  };
}

export function givenCompetition(data?: Partial<Competition>): Competition {
  const dto = givenCreateCompetitionDto(data);

  return new Competition(
    dto.name,
    dto.type,
    dto.startDate,
    dto.endDate,
    dto.address,
    dto.city,
    dto.postalCode,
    dto.categories,
    data?.state,
  );
}
