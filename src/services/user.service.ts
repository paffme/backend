import {UserService} from '@loopback/authentication';
import {User} from '../models';
import {repository} from '@loopback/repository';
import {inject} from '@loopback/context';
import {PasswordHasherBindings} from '../keys';
import {PasswordHasher} from './bcrypt.service';
import {HttpErrors} from '@loopback/rest/dist';
import {Credentials, UserRepository} from '../repositories';
import {UserProfile, securityId} from '@loopback/security';

export class CustomUserService implements UserService<User, Credentials> {
  constructor(
    @repository(UserRepository) public userRepository: UserRepository,
    @inject(PasswordHasherBindings.PASSWORD_HASHER)
    public passwordHasher: PasswordHasher,
  ) {}

  async verifyCredentials(credentials: Credentials): Promise<User> {
    const foundUser = await this.userRepository.findOne({
      where: {email: credentials.email},
    });

    if (!foundUser) {
      throw new HttpErrors.NotFound(
        `User with email ${credentials.email} not found.`,
      );
    }
    const passwordMatched = await this.passwordHasher.comparePassword(
      credentials.password,
      foundUser.userCredentials.password,
    );

    if (!passwordMatched) {
      throw new HttpErrors.Unauthorized('The credentials are not correct.');
    }

    return foundUser;
  }

  convertToUserProfile(user: User): UserProfile {
    let userName = '';
    if (user.firstName) userName = `${user.firstName}`;
    if (user.lastName)
      userName = user.firstName
        ? `${userName} ${user.lastName}`
        : `${user.lastName}`;

    return {
      [securityId]: String(user.id),
      email: user.email,
      name: userName,
    };
  }
}
