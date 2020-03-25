import { RegisterDto } from '../../src/user/dto/register.dto';
import * as uuid from 'uuid';
import { TokenResponseDto } from '../../src/user/dto/token-response.dto';
import { CredentialsDto } from '../../src/user/dto/credentials.dto';
import { UserDto } from '../../src/user/dto/user.dto';

export default class TestUtils {
  constructor(private readonly api) {}

  createUser(): Promise<CredentialsDto & UserDto> {
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
