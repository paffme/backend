import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt } from 'crypto';
import { EntityRepository, FilterQuery, wrap } from 'mikro-orm';
import { InjectRepository } from 'nestjs-mikro-orm';
import { UpdateUserDto } from './dto/in/body/update-user.dto';
import { User } from './user.entity';
import { RegisterDto } from './dto/in/body/register.dto';
import { CredentialsDto } from './dto/in/body/credentials.dto';
import { TokenResponseDto } from './dto/out/token-response.dto';
import { JwtPayload } from '../shared/authentication/jwt-payload.interface';
import { AuthenticationService } from '../shared/authentication/authentication.service';
import { UserMapper } from '../shared/mappers/user.mapper';
import { CompetitionRegistration } from '../shared/entity/competition-registration.entity';
import { Competition } from '../competition/competition.entity';
import {
  OffsetLimitRequest,
  OffsetLimitResponse,
} from '../shared/pagination/pagination.service';
import { SearchQuery } from '../shared/decorators/search.decorator';
import { UserCompetitionRolesDto } from './dto/out/user-competition-roles.dto';
import { EmailAlreadyUsedError } from './errors/email-already-used.error';
import { InvalidCredentialsError } from './errors/invalid-credentials.error';
import { UserNotFoundError } from './errors/user-not-found.error';
import { JudgementAssignment } from './interfaces/judgement-assignement.type';
import { BoulderingRoundState } from '../bouldering/round/bouldering-round.entity';
import { isDefined, isNil } from '../shared/utils/objects.helper';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    mapper: UserMapper,
    private readonly authService: AuthenticationService,
  ) {}

  private readonly SCRYPT_MEMBERS_SEPARATOR = '$';
  private readonly SCRYPT_MEMBERS_ENCODING = 'hex';

  private hashPassword(password: string): Promise<string> {
    const scryptLen = 64;
    const salt = randomBytes(scryptLen);

    return new Promise((resolve, reject) => {
      scrypt(password, salt, scryptLen, (err, derivedKey) => {
        if (isDefined(err)) {
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
    saltedPasswordHash: string,
    candidatePassword: string,
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
          if (isDefined(err)) {
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

  async get(
    offsetLimitRequest: OffsetLimitRequest,
    search: SearchQuery<User>,
  ): Promise<OffsetLimitResponse<User>> {
    const [data, total] = await this.userRepository.findAndCount(
      search.filter,
      {
        offset: offsetLimitRequest.offset,
        limit: offsetLimitRequest.limit,
        orderBy: search.order,
      },
    );

    return {
      data,
      total,
    };
  }

  count(): Promise<number> {
    return this.userRepository.count();
  }

  async register(dto: RegisterDto): Promise<User> {
    const { email, password } = dto;

    const exists = await this.userRepository.count({
      email,
    });

    if (exists > 0) {
      throw new EmailAlreadyUsedError();
    }

    const hashedPassword = await this.hashPassword(password);

    const newUser = new User(
      dto.firstName,
      dto.lastName,
      dto.birthYear,
      dto.sex,
      email,
      hashedPassword,
      dto.club,
    );

    await this.userRepository.persistAndFlush(newUser);
    return newUser;
  }

  async login(dto: CredentialsDto): Promise<TokenResponseDto> {
    const { email, password } = dto;

    const user = await this.userRepository.findOne({
      email,
    });

    if (isNil(user)) {
      throw new InvalidCredentialsError();
    }

    const isMatch = await this.checkPassword(user.password, password);

    if (!isMatch) {
      throw new InvalidCredentialsError();
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
  ): Promise<User> {
    const user = await this.getOrFail(userId);

    if (isDefined(dto.password)) {
      dto.password = await this.hashPassword(dto.password);
    }

    if (isDefined(dto.email)) {
      const exists = await this.userRepository.count({
        email: dto.email,
      });

      if (exists > 0) {
        throw new EmailAlreadyUsedError();
      }
    }

    wrap(user).assign(dto);
    await this.userRepository.flush();
    return user;
  }

  async getOrFail(
    userId: typeof User.prototype.id,
    populate?: string[],
    where?: FilterQuery<User>,
  ): Promise<User> {
    const whereQuery = {
      id: userId,
    };

    if (isDefined(where)) {
      Object.assign(whereQuery, where);
    }

    const user = await this.userRepository.findOne(whereQuery, populate);

    if (isNil(user)) {
      throw new UserNotFoundError();
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

  async getOrganizations(
    userId: typeof User.prototype.id,
  ): Promise<Competition[]> {
    const user = await this.getOrFail(userId, ['organizations']);
    return user.organizations.getItems();
  }

  async getCompetitionRoles(
    userId: typeof User.prototype.id,
    competitionId: typeof Competition.prototype.id,
  ): Promise<UserCompetitionRolesDto> {
    const user = await this.getOrFail(userId);

    const initOptions = {
      where: {
        id: competitionId,
      },
    };

    const [
      organizations,
      juryPresidencies,
      judgements,
      chiefRouteSettings,
      routeSettings,
      technicalDelegations,
    ] = await Promise.all([
      user.organizations.init(initOptions),
      user.juryPresidencies.init(initOptions),
      user.judgements.init(initOptions),
      user.chiefRouteSettings.init(initOptions),
      user.routeSettings.init(initOptions),
      user.technicalDelegations.init(initOptions),
    ]);

    return {
      organizer: organizations.count() === 1,
      juryPresident: juryPresidencies.count() === 1,
      judge: judgements.count() === 1,
      chiefRouteSetter: chiefRouteSettings.count() === 1,
      routeSetter: routeSettings.count() === 1,
      technicalDelegate: technicalDelegations.count() === 1,
    };
  }

  async getJudgementAssignments(
    userId: typeof User.prototype.id,
  ): Promise<JudgementAssignment[]> {
    const { judgedBoulders } = await this.getOrFail(
      userId,
      ['judgedBoulders.group.round.competition'],
      {
        judgedBoulders: {
          group: {
            state: BoulderingRoundState.ONGOING,
          },
        },
      },
    );

    return judgedBoulders.getItems();
  }

  async getCompetitionJudgementAssignments(
    userId: typeof User.prototype.id,
    competitionId: typeof Competition.prototype.id,
  ): Promise<JudgementAssignment[]> {
    const { judgedBoulders } = await this.getOrFail(
      userId,
      ['judgedBoulders.group.round.competition'],
      {
        judgedBoulders: {
          group: {
            state: BoulderingRoundState.ONGOING,
            round: {
              competition: {
                id: competitionId,
              },
            },
          },
        },
      },
    );

    return judgedBoulders.getItems();
  }
}
