import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ApiException } from '../shared/api-exception.model';
import { GetOperationId } from '../shared/utils/get-operation-id.helper';
import { User } from './user.entity';
import { TokenResponseDto } from './dto/token-response.dto';
import { CredentialsDto } from './dto/credentials.dto';
import { RegisterDto } from './dto/register.dto';
import { UserDto } from './dto/user.dto';
import { UserService } from './user.service';
import { UpdateParamsDto } from './dto/update-params.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AllowedSystemRoles } from '../shared/decorators/roles.decorator';
import { SystemRole } from './user-role.enum';
import { AuthGuard } from '@nestjs/passport';
import { SystemRoleGuard } from '../shared/guards/system-role.guard';
import { FindByIdParamsDto } from './dto/find-by-id-params.dto';
import { User as GetUser } from '../shared/decorators/user.decorator';
import { CompetitionRegistrationDto } from '../competition/dto/out/competition-registration.dto';
import { GetUserCompetitionRegistrationsParamsDto } from './dto/in/get-user-competition-registrations-params.dto';
import { CompetitionRegistrationMapper } from '../shared/mappers/competition-registration.mapper';

@Controller('users')
@ApiTags(User.constructor.name)
@ApiBearerAuth()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly competitionRegistrationMapper: CompetitionRegistrationMapper,
  ) {}

  @Post()
  @ApiCreatedResponse({ type: UserDto })
  @ApiConflictResponse({ type: ApiException })
  @ApiUnprocessableEntityResponse({ type: ApiException })
  @ApiOperation(GetOperationId(User.constructor.name, 'Register'))
  async register(@Body() dto: RegisterDto): Promise<UserDto> {
    const newUser = await this.userService.register(dto);
    return this.userService.mapper.map(newUser);
  }

  @Post('token')
  @ApiCreatedResponse({ type: TokenResponseDto })
  @ApiBadRequestResponse({ type: ApiException })
  @ApiUnprocessableEntityResponse({ type: ApiException })
  @ApiOperation(GetOperationId(User.constructor.name, 'Login'))
  async login(@Body() dto: CredentialsDto): Promise<TokenResponseDto> {
    return this.userService.login(dto);
  }

  @Get(':userId')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @UseGuards(AuthGuard('jwt'), SystemRoleGuard)
  @ApiOkResponse({ type: UserDto })
  @ApiUnprocessableEntityResponse({ type: ApiException })
  @ApiNotFoundResponse({ type: ApiException })
  @ApiOperation(GetOperationId(User.constructor.name, 'FindById'))
  @ApiParam({ name: 'userId', required: true })
  async findById(@Param() params: FindByIdParamsDto): Promise<UserDto> {
    const user = await this.userService.getOrFail(params.userId);
    return this.userService.mapper.map(user);
  }

  @Delete(':userId')
  @HttpCode(204)
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @UseGuards(AuthGuard('jwt'), SystemRoleGuard)
  @ApiNoContentResponse({})
  @ApiNotFoundResponse({ type: ApiException })
  @ApiOperation(GetOperationId(User.constructor.name, 'DeleteById'))
  @ApiParam({ name: 'userId', required: true })
  async deleteById(
    @Param() params: FindByIdParamsDto,
    @GetUser() user: User,
  ): Promise<void> {
    if (user.systemRole === SystemRole.User && user.id !== params.userId) {
      throw new ForbiddenException('Not you');
    }

    await this.userService.deleteById(params.userId);
  }

  @Patch(':userId')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @UseGuards(AuthGuard('jwt'), SystemRoleGuard)
  @ApiOkResponse({ type: UserDto })
  @ApiUnprocessableEntityResponse({ type: ApiException })
  @ApiNotFoundResponse({ type: ApiException })
  @ApiOperation(GetOperationId(User.constructor.name, 'Update'))
  @ApiParam({ name: 'userId', required: true })
  async update(
    @Param() params: UpdateParamsDto,
    @Body() dto: UpdateUserDto,
    @GetUser() user: User,
  ): Promise<UserDto> {
    const updatedUser = await this.userService.updateUser(
      params.userId,
      dto,
      user,
    );

    return this.userService.mapper.map(updatedUser);
  }

  @Get('/:userId/registrations')
  @ApiOkResponse({ isArray: true, type: CompetitionRegistrationDto })
  @ApiOperation(GetOperationId(User.constructor.name, 'GetRegistrations'))
  async getCompetitionRegistrations(
    @Param() params: GetUserCompetitionRegistrationsParamsDto,
  ): Promise<CompetitionRegistrationDto[]> {
    const competitionRegistrations = await this.userService.getUserRegistrations(
      params.userId,
    );

    return this.competitionRegistrationMapper.mapArray(
      competitionRegistrations,
    );
  }
}
