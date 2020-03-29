import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes, scrypt } from 'crypto';
import { EntityRepository, wrap } from 'mikro-orm';
import { InjectRepository } from 'nestjs-mikro-orm';
import { UpdateUserDto } from './dto/in/body/update-user.dto';
import { User } from './user.entity';
import { RegisterDto } from './dto/in/body/register.dto';
import { CredentialsDto } from './dto/in/body/credentials.dto';
import { TokenResponseDto } from './dto/out/token-response.dto';
import { JwtPayload } from '../shared/auth/jwt-payload.interface';
import { AuthService } from '../shared/auth/auth.service';
import { validate } from 'class-validator';
import { UserMapper } from '../shared/mappers/user.mapper';
import { BaseService } from '../shared/base.service';
import { UserDto } from './dto/out/user.dto';
import { CompetitionRegistration } from '../shared/entity/competition-registration.entity';
import { Competition } from '../competition/competition.entity';

@Injectable()
export class UserService extends BaseService<User, UserDto> {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    mapper: UserMapper,
    private readonly authService: AuthService,
  ) {
    super(User.prototype, mapper);
  }

  private readonly SCRYPT_MEMBERS_SEPARATOR = '$';
  private readonly SCRYPT_MEMBERS_ENCODING = 'hex';

  private hashPassword(password: string): Promise<string> {
    const scryptLen = 64;
    const salt = randomBytes(scryptLen);

    return new Promise((resolve, reject) => {
      scrypt(password, salt, scryptLen, (err, derivedKey) => {
        if (err) {
          return reject(err);
        }

        resolve(
          scryptLen +
            this.SCRYPT_MEMBERS_SEPARATOR +
            salt.toString(this.SCRYPT_MEMBERS_ENCODING) +
            this.SCRYPT_MEMBERS_SEPARATOR +
            derivedKey.toString(this.SCRYPT_MEMBERS_ENCODING),
        );
      });
    });
  }

  private checkPassword(
    saltedPasswordHash,
    candidatePassword,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const [scryptLen, salt, expectedDerivedKey] = saltedPasswordHash.split(
        this.SCRYPT_MEMBERS_SEPARATOR,
      );

      scrypt(
        candidatePassword,
        Buffer.from(salt, this.SCRYPT_MEMBERS_ENCODING),
        Number(scryptLen),
        (err, derivedKey) => {
          if (err) {
            return reject(err);
          }

          resolve(
            expectedDerivedKey ===
              derivedKey.toString(this.SCRYPT_MEMBERS_ENCODING),
          );
        },
      );
    });
  }

  async register(dto: RegisterDto): Promise<User> {
    const { email, password } = dto;

    const exists = await this.userRepository.count({
      email,
    });

    if (exists > 0) {
      throw new ConflictException('email already used');
    }

    const newUser = new User();
    newUser.password = await this.hashPassword(password);
    newUser.email = email.trim();

    const errors = await validate(newUser);

    if (errors.length > 0) {
      throw new HttpException(
        {
          message: 'Input data validation failed',
          errors,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.userRepository.persistAndFlush(newUser);
    return newUser;
  }

  async login(dto: CredentialsDto): Promise<TokenResponseDto> {
    const { email, password } = dto;

    const user = await this.userRepository.findOne({
      email,
    });

    if (!user) {
      throw new HttpException('Invalid credentials', HttpStatus.BAD_REQUEST);
    }

    const isMatch = await this.checkPassword(user.password, password);

    if (!isMatch) {
      throw new HttpException('Invalid credentials', HttpStatus.BAD_REQUEST);
    }

    const payload: JwtPayload = {
      email: user.email,
      systemRole: user.systemRole,
      id: user.id,
    };

    const { token, createdAt, expiresIn } = await this.authService.signPayload(
      payload,
    );

    return {
      token,
      expiresIn,
      createdAt,
      userId: user.id,
    };
  }

  async updateUser(
    userId: typeof User.prototype.id,
    dto: UpdateUserDto,
    authenticatedUser: User,
  ): Promise<User> {
    const user = await this.getOrFail(userId);

    if (user.id !== authenticatedUser.id) {
      throw new ForbiddenException('You do not own this user');
    }

    if (dto.password) {
      dto.password = await this.hashPassword(dto.password);
    }

    wrap(user).assign(dto);
    await this.userRepository.flush();
    return user;
  }

  async getOrFail(
    userId: typeof User.prototype.id,
    populate?: string[],
  ): Promise<User> {
    const user = await this.userRepository.findOne(userId, populate);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async deleteById(userId: typeof User.prototype.id): Promise<void> {
    const entity = await this.getOrFail(userId);
    await this.userRepository.removeAndFlush(entity);
  }

  async getUserRegistrations(
    userId: typeof User.prototype.id,
  ): Promise<CompetitionRegistration[]> {
    const user = await this.getOrFail(userId, ['registrations']);
    return user.registrations.getItems();
  }

  async getJuryPresidencies(
    userId: typeof User.prototype.id,
  ): Promise<Competition[]> {
    const user = await this.getOrFail(userId, ['juryPresidencies']);
    return user.juryPresidencies.getItems();
  }

  async getJudgements(
    userId: typeof User.prototype.id,
  ): Promise<Competition[]> {
    const user = await this.getOrFail(userId, ['judgements']);
    return user.judgements.getItems();
  }

  async getChiefRouteSettings(
    userId: typeof User.prototype.id,
  ): Promise<Competition[]> {
    const user = await this.getOrFail(userId, ['chiefRouteSettings']);
    return user.chiefRouteSettings.getItems();
  }

  async getRouteSettings(
    userId: typeof User.prototype.id,
  ): Promise<Competition[]> {
    const user = await this.getOrFail(userId, ['routeSettings']);
    return user.routeSettings.getItems();
  }

  async getTechnicalDelegations(
    userId: typeof User.prototype.id,
  ): Promise<Competition[]> {
    const user = await this.getOrFail(userId, ['technicalDelegations']);
    return user.technicalDelegations.getItems();
  }
}
