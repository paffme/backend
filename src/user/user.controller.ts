import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
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
import { AllowedAppRoles } from '../shared/decorators/allowed-app-roles.decorator';
import { OptionalJwtAuthenticationGuard } from '../shared/guards/optional-jwt-authentication.guard';
import { UserAuthorizationGuard } from '../shared/authorization/user.authorization.guard';
import { UserMapper } from '../shared/mappers/user.mapper';
import { UserCompetitionsRolesDto } from './dto/out/user-competitions-roles.dto';
import { GetUserCompetitionsRolesParamsDto } from './dto/in/params/get-user-competitions-roles-params.dto';
import { UserLimitedDto } from './dto/out/user-limited.dto';
import { Search, SearchQuery } from '../shared/decorators/search.decorator';
import { Request } from 'express';
import {
  OffsetLimitRequest,
  PaginationService,
} from '../shared/pagination/pagination.service';
import { LimitedUserMapper } from '../shared/mappers/limited-user.mapper';
import { Pagination } from '../shared/decorators/pagination.decorator';
import { SearchUsersDto } from './dto/in/search/search-users.dto';
import { GetUserCompetitionRolesParamsDto } from './dto/in/params/get-user-competition-roles-params.dto';
import { UserCompetitionRolesDto } from './dto/out/user-competition-roles.dto';
import { CountDto } from '../shared/dto/count.dto';

@Controller('users')
@ApiTags(User.name)
@ApiBearerAuth()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly competitionRegistrationMapper: CompetitionRegistrationMapper,
    private readonly competitionMapper: CompetitionMapper,
    private readonly mapper: UserMapper,
    private readonly limitedUserMapper: LimitedUserMapper,
    private readonly paginationService: PaginationService,
  ) {}

  @Get()
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @UseGuards(AuthGuard('jwt'), AuthenticationGuard)
  @ApiOkResponse({ type: UserLimitedDto, isArray: true })
  @ApiOperation(GetOperationId(User.name, 'Get'))
  async get(
    @Pagination() offsetLimitRequest: OffsetLimitRequest,
    @Search(SearchUsersDto, {
      mandatoryQuery: true,
    })
    search: SearchQuery<User>,
    @Req() request: Request,
  ): Promise<UserLimitedDto[]> {
    const offsetLimitResponse = await this.userService.get(
      offsetLimitRequest,
      search,
    );

    this.paginationService.addPaginationHeaders(
      offsetLimitResponse,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      request.res!,
    );

    return this.limitedUserMapper.mapArray(offsetLimitResponse.data);
  }

  @Get('/count')
  @ApiOkResponse({ type: CountDto })
  @ApiOperation(GetOperationId(User.name, 'Count'))
  async count(): Promise<CountDto> {
    const count = await this.userService.count();

    return {
      count,
    };
  }

  @Post()
  @AllowedAppRoles(AppRoles.UNAUTHENTICATED)
  @UseGuards(OptionalJwtAuthenticationGuard, UserAuthorizationGuard)
  @ApiCreatedResponse({ type: UserDto })
  @ApiConflictResponse({ type: ApiException })
  @ApiUnprocessableEntityResponse({ type: ApiException })
  @ApiOperation(GetOperationId(User.name, 'Register'))
  async register(@Body() dto: RegisterDto): Promise<UserDto> {
    const newUser = await this.userService.register(dto);
    return this.mapper.map(newUser);
  }

  @Post('token')
  @ApiCreatedResponse({ type: TokenResponseDto })
  @ApiBadRequestResponse({ type: ApiException })
  @ApiUnprocessableEntityResponse({ type: ApiException })
  @ApiOperation(GetOperationId(User.name, 'Login'))
  async login(@Body() dto: CredentialsDto): Promise<TokenResponseDto> {
    return this.userService.login(dto);
  }

  @Get(':userId')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), AuthenticationGuard, UserAuthorizationGuard)
  @ApiOkResponse({ type: UserDto })
  @ApiUnprocessableEntityResponse({ type: ApiException })
  @ApiNotFoundResponse({ type: ApiException })
  @ApiOperation(GetOperationId(User.name, 'FindById'))
  @ApiParam({ name: 'userId', required: true })
  async findById(@Param() params: FindByIdParamsDto): Promise<UserDto> {
    const user = await this.userService.getOrFail(params.userId);
    return this.mapper.map(user);
  }

  @Delete(':userId')
  @HttpCode(204)
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), AuthenticationGuard, UserAuthorizationGuard)
  @ApiNoContentResponse({})
  @ApiNotFoundResponse({ type: ApiException })
  @ApiOperation(GetOperationId(User.name, 'DeleteById'))
  @ApiParam({ name: 'userId', required: true })
  async deleteById(@Param() params: FindByIdParamsDto): Promise<void> {
    await this.userService.deleteById(params.userId);
  }

  @Patch(':userId')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), AuthenticationGuard, UserAuthorizationGuard)
  @ApiOkResponse({ type: UserDto })
  @ApiUnprocessableEntityResponse({ type: ApiException })
  @ApiNotFoundResponse({ type: ApiException })
  @ApiOperation(GetOperationId(User.name, 'Update'))
  @ApiParam({ name: 'userId', required: true })
  async update(
    @Param() params: UpdateParamsDto,
    @Body() dto: UpdateUserDto,
  ): Promise<UserDto> {
    const updatedUser = await this.userService.updateUser(params.userId, dto);
    return this.mapper.map(updatedUser);
  }

  @Get('/:userId/registrations')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), AuthenticationGuard, UserAuthorizationGuard)
  @ApiOkResponse({ isArray: true, type: CompetitionRegistrationDto })
  @ApiOperation(GetOperationId(User.name, 'GetRegistrations'))
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
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), AuthenticationGuard, UserAuthorizationGuard)
  @ApiOkResponse({ isArray: true, type: CompetitionDto })
  @ApiOperation(GetOperationId(User.name, 'GetJuryPresidencies'))
  async getJuryPresidencies(
    @Param() params: GetJuryPresidenciesParamsDto,
  ): Promise<CompetitionDto[]> {
    const juryPresidencies = await this.userService.getJuryPresidencies(
      params.userId,
    );

    return this.competitionMapper.mapArray(juryPresidencies);
  }

  @Get('/:userId/judgements')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), AuthenticationGuard, UserAuthorizationGuard)
  @ApiOkResponse({ isArray: true, type: CompetitionDto })
  @ApiOperation(GetOperationId(User.name, 'GetJudgements'))
  async getJudgements(
    @Param() params: GetJudgementsParamsDto,
  ): Promise<CompetitionDto[]> {
    const judgements = await this.userService.getJudgements(params.userId);
    return this.competitionMapper.mapArray(judgements);
  }

  @Get('/:userId/chief-route-settings')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), AuthenticationGuard, UserAuthorizationGuard)
  @ApiOkResponse({ isArray: true, type: CompetitionDto })
  @ApiOperation(GetOperationId(User.name, 'GetChiefRouteSettings'))
  async getChiefRouteSettings(
    @Param() params: GetChiefRouteSettingsParamsDto,
  ): Promise<CompetitionDto[]> {
    const chiefRouteSettings = await this.userService.getChiefRouteSettings(
      params.userId,
    );

    return this.competitionMapper.mapArray(chiefRouteSettings);
  }

  @Get('/:userId/route-settings')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), AuthenticationGuard, UserAuthorizationGuard)
  @ApiOkResponse({ isArray: true, type: CompetitionDto })
  @ApiOperation(GetOperationId(User.name, 'GetRouteSettings'))
  async getRouteSettings(
    @Param() params: GetRouteSettingsParamsDto,
  ): Promise<CompetitionDto[]> {
    const routeSettings = await this.userService.getRouteSettings(
      params.userId,
    );

    return this.competitionMapper.mapArray(routeSettings);
  }

  @Get('/:userId/technical-delegations')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), AuthenticationGuard, UserAuthorizationGuard)
  @ApiOkResponse({ isArray: true, type: CompetitionDto })
  @ApiOperation(GetOperationId(User.name, 'GetTechnicalDelegations'))
  async getTechnicalDelegations(
    @Param() params: GetRouteSettingsParamsDto,
  ): Promise<CompetitionDto[]> {
    const technicalDelegates = await this.userService.getTechnicalDelegations(
      params.userId,
    );

    return this.competitionMapper.mapArray(technicalDelegates);
  }

  @Get('/:userId/organizations')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), AuthenticationGuard, UserAuthorizationGuard)
  @ApiOkResponse({ isArray: true, type: CompetitionDto })
  @ApiOperation(GetOperationId(User.name, 'GetOrganizations'))
  async getOrganizations(
    @Param() params: GetRouteSettingsParamsDto,
  ): Promise<CompetitionDto[]> {
    const organizations = await this.userService.getOrganizations(
      params.userId,
    );

    return this.competitionMapper.mapArray(organizations);
  }

  @Get('/:userId/competitions-roles')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), AuthenticationGuard, UserAuthorizationGuard)
  @ApiOkResponse({ type: UserCompetitionsRolesDto })
  @ApiOperation(GetOperationId(User.name, 'GetUserCompetitionsRoles'))
  async getUserCompetitionsRoles(
    @Param() params: GetUserCompetitionsRolesParamsDto,
  ): Promise<UserCompetitionsRolesDto> {
    const [
      organizations,
      juryPresidencies,
      judgements,
      chiefRouteSettings,
      routeSettings,
      technicalDelegations,
    ] = await Promise.all([
      this.userService.getOrganizations(params.userId),
      this.userService.getJuryPresidencies(params.userId),
      this.userService.getJudgements(params.userId),
      this.userService.getChiefRouteSettings(params.userId),
      this.userService.getRouteSettings(params.userId),
      this.userService.getTechnicalDelegations(params.userId),
    ]);

    return {
      organizations: this.competitionMapper.mapArray(organizations),
      juryPresidencies: this.competitionMapper.mapArray(juryPresidencies),
      judgements: this.competitionMapper.mapArray(judgements),
      chiefRouteSettings: this.competitionMapper.mapArray(chiefRouteSettings),
      routeSettings: this.competitionMapper.mapArray(routeSettings),
      technicalDelegations: this.competitionMapper.mapArray(
        technicalDelegations,
      ),
    };
  }

  @Get('/:userId/competitions-roles/:competitionId')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), AuthenticationGuard, UserAuthorizationGuard)
  @ApiOkResponse({ type: UserCompetitionRolesDto })
  @ApiOperation(GetOperationId(User.name, 'GetUserCompetitionRoles'))
  async getUserCompetitionRole(
    @Param() params: GetUserCompetitionRolesParamsDto,
  ): Promise<UserCompetitionRolesDto> {
    return this.userService.getCompetitionRoles(
      params.userId,
      params.competitionId,
    );
  }
}
