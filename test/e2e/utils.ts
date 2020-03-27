import { RegisterDto } from '../../src/user/dto/register.dto';
import * as uuid from 'uuid';
import { TokenResponseDto } from '../../src/user/dto/token-response.dto';
import { CredentialsDto } from '../../src/user/dto/credentials.dto';
import { UserDto } from '../../src/user/dto/user.dto';
import { CreateCompetitionDTO } from '../../src/competition/dto/create-competition.dto';
import { CompetitionDto } from '../../src/competition/dto/competition.dto';
import {
  CategoryName,
  CompetitionType,
  Sex,
} from '../../src/competition/competition.entity';

export default class TestUtils {
  constructor(private readonly api) {}

  givenUser(): Promise<CredentialsDto & UserDto> {
    return new Promise((resolve, reject) => {
      const user: RegisterDto = {
        email: `${uuid.v4()}@${uuid.v4()}.fr`,
        password: uuid.v4().substr(0, 10),
      };

      return this.api
        .post('/api/users')
        .send(user)
        .expect(201)
        .then((res) => {
          resolve({
            ...res.body,
            ...user,
          });
        })
        .catch(reject);
    });
  }

  givenCompetitionData(): CreateCompetitionDTO {
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
      address: uuid.v4(),
      categories: [
        {
          sex: Sex.Male,
          name: CategoryName.Minime,
        },
      ],
      city: uuid.v4(),
      name: uuid.v4(),
      postalCode: uuid.v4(),
      type: CompetitionType.Lead,
      startDate: today,
      endDate: tomorrow,
    };
  }

  async givenCompetition(
    tokenResponse: TokenResponseDto,
  ): Promise<CompetitionDto> {
    const competition = this.givenCompetitionData();

    const res = await this.api
      .post('/api/competitions')
      .set('Authorization', `Bearer ${tokenResponse.token}`)
      .send(competition)
      .expect(201);

    return res.body;
  }

  login(user: CredentialsDto): Promise<TokenResponseDto> {
    return new Promise((resolve, reject) => {
      this.api
        .post('/api/users/token')
        .send({
          email: user.email,
          password: user.password,
        })
        .expect(201)
        .then((res) => {
          resolve(res.body);
        })
        .catch(reject);
    });
  }
}
