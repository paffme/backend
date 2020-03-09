import {CompetitionRepository} from '../../repositories';
import {PostgreDataSource} from '../../datasources';
import {CategoryName, Competition, CompetitionType, Sex} from '../../models';
import * as uuid from 'uuid';

export async function givenEmptyDatabase() {
  await new CompetitionRepository(new PostgreDataSource()).deleteAll();
}

export function givenCompetitionData(data?: Partial<Competition>): Partial<Competition> {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  startDate.setDate(startDate.getDate() + 1);
  endDate.setDate(endDate.getDate() + 2);

  return Object.assign<Partial<Competition>, Partial<Competition> | undefined>({
    name: `Competition ${uuid.v4()}`,
    startDate,
    endDate,
    city: 'Caen',
    type: CompetitionType.Lead,
    categories: [{
      name: CategoryName.Minime,
      sex: Sex.Male,
    }],
  }, data);
}

export function givenCompetition(data?: Partial<Competition>): Promise<Competition> {
  return new CompetitionRepository(new PostgreDataSource()).create(givenCompetitionData(data));
}
