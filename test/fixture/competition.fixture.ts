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
    open: data?.open ?? false,
    agenda: data?.agenda ?? uuid.v4(),
    description: data?.description ?? uuid.v4(),
    welcomingDate: data?.welcomingDate ?? new Date(),
    city: data?.city ?? uuid.v4().substring(0, 10),
    name: data?.name ?? uuid.v4().substring(0, 8),
    postalCode: data?.postalCode ?? uuid.v4().substring(0, 6),
    type: data?.type ?? CompetitionType.Bouldering,
    startDate: data?.startDate ?? today,
    endDate: data?.endDate ?? tomorrow,
  };
}

export function givenCompetition(data?: Partial<Competition>): Competition {
  const dto = givenCreateCompetitionDto(data);

  return new Competition(
    dto.name,
    dto.type,
    dto.description,
    dto.agenda,
    dto.open,
    dto.welcomingDate,
    dto.startDate,
    dto.endDate,
    dto.address,
    dto.city,
    dto.postalCode,
    dto.categories,
    data?.state,
  );
}
