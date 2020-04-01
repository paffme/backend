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
import { TokenResponseDto } from './dto/out/token-response.dto';
import { CredentialsDto } from './dto/in/body/credentials.dto';
import { RegisterDto } from './dto/in/body/register.dto';
import { UserDto } from './dto/out/user.dto';
import { UserService } from './user.service';
import { UpdateParamsDto } from './dto/in/params/update-params.dto';
import { UpdateUserDto } from './dto/in/body/update-user.dto';
import { AllowedSystemRoles } from '../shared/decorators/allowed-system-roles.decorator';
import { SystemRole } from './user-role.enum';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticationGuard } from '../shared/guards/authentication.guard';
import { FindByIdParamsDto } from './dto/in/params/find-by-id-params.dto';
import { User as GetUser } from '../shared/decorators/user.decorator';
import { CompetitionRegistrationDto } from '../competition/dto/out/competition-registration.dto';
import { GetUserCompetitionRegistrationsParamsDto } from './dto/in/params/get-user-competition-registrations-params.dto';
import { CompetitionRegistrationMapper } from '../shared/mappers/competition-registration.mapper';
import { CompetitionDto } from '../competition/dto/out/competition.dto';
import { CompetitionMapper } from '../shared/mappers/competition.mapper';
import { GetJuryPresidenciesParamsDto } from './dto/in/params/get-jury-presidencies-params.dto';
import { GetJudgementsParamsDto } from './dto/in/params/get-judgements-params.dto';
import { GetChiefRouteSettingsParamsDto } from './dto/in/params/get-chief-route-settings-params.dto';
import { GetRouteSettingsParamsDto } from './dto/in/params/get-route-settings-params.dto';
import { AppRoles } from '../app.roles';
import { AuthorizationGuard } from '../shared/guards/authorization.guard';
import { AllowedAppRoles } from '../shared/decorators/allowed-app-roles.decorator';

@Controller('users')
@ApiTags(User.name)
@ApiBearerAuth()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly competitionRegistrationMapper: CompetitionRegistrationMapper,
    private readonly competitionMapper: CompetitionMapper,
  ) {}

  @Post()
  @ApiCreatedResponse({ type: UserDto })
  @ApiConflictResponse({ type: ApiException })
  @ApiUnprocessableEntityResponse({ type: ApiException })
  @ApiOperation(GetOperationId(User.constructor.name, 'Register'))
  // TODO : only unauthenticated
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
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), AuthenticationGuard, AuthorizationGuard)
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
  @UseGuards(AuthGuard('jwt'), AuthenticationGuard)
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
  @UseGuards(AuthGuard('jwt'), AuthenticationGuard)
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

  @Get('/:userId/jury-presidencies')
  @ApiOkResponse({ isArray: true, type: CompetitionDto })
  @ApiOperation(GetOperationId(User.constructor.name, 'GetJuryPresidencies'))
  async getJuryPresidencies(
    @Param() params: GetJuryPresidenciesParamsDto,
  ): Promise<CompetitionDto[]> {
    const juryPresidencies = await this.userService.getJuryPresidencies(
      params.userId,
    );

    return this.competitionMapper.mapArray(juryPresidencies);
  }

  @Get('/:userId/judgements')
  @ApiOkResponse({ isArray: true, type: CompetitionDto })
  @ApiOperation(GetOperationId(User.constructor.name, 'GetJudgements'))
  async getJudgements(
    @Param() params: GetJudgementsParamsDto,
  ): Promise<CompetitionDto[]> {
    const judgements = await this.userService.getJudgements(params.userId);
    return this.competitionMapper.mapArray(judgements);
  }

  @Get('/:userId/chief-route-settings')
  @ApiOkResponse({ isArray: true, type: CompetitionDto })
  @ApiOperation(GetOperationId(User.constructor.name, 'GetChiefRouteSettings'))
  async getChiefRouteSettings(
    @Param() params: GetChiefRouteSettingsParamsDto,
  ): Promise<CompetitionDto[]> {
    const chiefRouteSettings = await this.userService.getChiefRouteSettings(
      params.userId,
    );

    return this.competitionMapper.mapArray(chiefRouteSettings);
  }

  @Get('/:userId/route-settings')
  @ApiOkResponse({ isArray: true, type: CompetitionDto })
  @ApiOperation(GetOperationId(User.constructor.name, 'GetRouteSettings'))
  async getRouteSettings(
    @Param() params: GetRouteSettingsParamsDto,
  ): Promise<CompetitionDto[]> {
    const routeSettings = await this.userService.getRouteSettings(
      params.userId,
    );

    return this.competitionMapper.mapArray(routeSettings);
  }

  @Get('/:userId/technical-delegations')
  @ApiOkResponse({ isArray: true, type: CompetitionDto })
  @ApiOperation(
    GetOperationId(User.constructor.name, 'GetTechnicalDelegations'),
  )
  async getTechnicalDelegations(
    @Param() params: GetRouteSettingsParamsDto,
  ): Promise<CompetitionDto[]> {
    const technicalDelegates = await this.userService.getTechnicalDelegations(
      params.userId,
    );

    return this.competitionMapper.mapArray(technicalDelegates);
  }
}
