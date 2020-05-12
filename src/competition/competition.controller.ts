import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import {
  OffsetLimitRequest,
  PaginationService,
} from '../shared/pagination/pagination.service';

import { CompetitionDto } from './dto/out/competition.dto';
import { AllowedSystemRoles } from '../shared/decorators/allowed-system-roles.decorator';
import { SystemRole } from '../user/user-role.enum';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticationGuard } from '../shared/guards/authentication.guard';
import { GetOperationId } from '../shared/utils/get-operation-id.helper';
import { CompetitionService } from './competition.service';
import { CreateCompetitionDTO } from './dto/in/body/create-competition.dto';
import { RegisterParamsDto } from './dto/in/params/register-params.dto';
import { CompetitionRegistrationDto } from './dto/out/competition-registration.dto';
import { Competition } from './competition.entity';
import { CompetitionRegistrationMapper } from '../shared/mappers/competition-registration.mapper';
import { GetCompetitionRegistrationsParamsDto } from './dto/in/params/get-competition-registrations-params.dto';
import { UserDto } from '../user/dto/out/user.dto';
import { UserMapper } from '../shared/mappers/user.mapper';
import { GetCompetitionJuryPresidentsParamsDto } from './dto/in/params/get-competition-jury-presidents-params.dto';
import { GetCompetitionJudgesParamsDto } from './dto/in/params/get-competition-judges-params.dto';
import { GetCompetitionChiefRouteSettersParamsDto } from './dto/in/params/get-competition-chief-route-setters-params.dto';
import { GetCompetitionRouteSettersParamsDto } from './dto/in/params/get-competition-route-setters-params.dto';
import { GetCompetitionTechnicalDelegatesParamsDto } from './dto/in/params/get-competition-technical-delegates-params.dto';
import { AddJuryPresidentParamsDto } from './dto/in/params/add-jury-president-params.dto';
import { AddJudgeParamsDto } from './dto/in/params/add-judge-params.dto';
import { AddChiefRouteSetterParamsDto } from './dto/in/params/add-chief-route-setter-params.dto';
import { AddRouteSetterParamsDto } from './dto/in/params/add-route-setter-params.dto';
import { AddTechnicalDelegateParamsDto } from './dto/in/params/add-technical-delegate-params.dto';
import { RemoveRegistrationParamsDto } from './dto/in/params/remove-registration-params.dto';
import { RemoveRouteSetterParamsDto } from './dto/in/params/remove-route-setter-params.dto';
import { RemoveJudgeParamsDto } from './dto/in/params/remove-judge-params.dto';
import { RemoveTechnicalDelegateParamsDto } from './dto/in/params/remove-technical-delegate-params.dto';
import { RemoveJuryPresidentParamsDto } from './dto/in/params/remove-jury-president-params.dto';
import { GetUser } from '../shared/decorators/user.decorator';
import { User } from '../user/user.entity';
import { AllowedAppRoles } from '../shared/decorators/allowed-app-roles.decorator';
import { AppRoles } from '../app.roles';
import { UserAuthorizationGuard } from '../shared/authorization/user.authorization.guard';
import { AddOrganizerParamsDto } from './dto/in/params/add-organizer-params.dto';
import { RemoveOrganizerParamsDto } from './dto/in/params/remove-organizer-params.dto';
import { OrganizerAuthorizationGuard } from './authorization/organizer.authorization.guard';
import { RemoveChiefRouteSetterParamsDto } from './dto/in/params/remove-chief-route-setter-params.dto';
import { AddRoundParamsDto } from './dto/in/params/add-round-params.dto';
import { JuryPresidentAuthorizationGuard } from './authorization/jury-president.authorization.guard';
import { BoulderingRoundDto } from '../bouldering/dto/out/bouldering-round.dto';
import { AddBoulderingResultParamsDto } from './dto/in/params/add-bouldering-result-params.dto';
import { BoulderingResultDto } from '../bouldering/dto/out/bouldering-result.dto';
import { CreateBoulderingRoundDto } from './dto/in/body/create-bouldering-round.dto';
import { CreateBoulderingResultDto } from './dto/in/body/create-bouldering-result.dto';
import { JudgeAuthorizationGuard } from './authorization/judge.authorization.guard';
import { BoulderingRoundMapper } from '../shared/mappers/bouldering-round.mapper';
import { CompetitionMapper } from '../shared/mappers/competition.mapper';
import { BoulderingResultMapper } from '../shared/mappers/bouldering-result.mapper';
import { GetRankingsParamsDto } from './dto/in/params/get-rankings-params.dto';
import { RankingsDto } from './dto/out/rankings.dto';
import { RankingsMapper } from '../shared/mappers/rankings.mapper';
import { GetCompetitionByIdParams } from './dto/in/params/get-competition-by-id.params';
import { UpdateCompetitionByIdParamsDto } from './dto/in/params/update-competition-by-id-params.dto';
import { UpdateCompetitionByIdDto } from './dto/in/body/update-competition-by-id.dto';
import { OrGuard } from '../shared/guards/or.authorization.guard';
import { ChiefRouteSetterAuthorizationGuard } from './authorization/chief-route-setter.authorization.guard';
import { Pagination } from '../shared/decorators/pagination.decorator';
import { Request } from 'express';
import { Search, SearchQuery } from '../shared/decorators/search.decorator';
import { SearchCompetitionsDto } from './dto/in/search/search-competitions.dto';
import { BoulderDto } from '../bouldering/dto/out/boulder.dto';
import { CreateBoulderParamsDto } from './dto/in/params/create-boulder-params.dto';
import { CreateBoulderDto } from './dto/in/body/create-boulder.dto';
import { BoulderMapper } from '../shared/mappers/boulder.mapper';
import { DeleteBoulderParamsDto } from './dto/in/params/delete-boulder-params.dto';
import { GetBoulderingRoundRankingsParamsDto } from './dto/in/params/get-bouldering-round-rankings-params.dto';
import { BoulderingRoundRankingsMapper } from '../shared/mappers/bouldering-round-rankings.mapper';
import { BoulderingRoundRankingsDto } from '../bouldering/dto/out/bouldering-round-rankings.dto';
import { CreateBoulderingGroupParamsDto } from './dto/in/params/create-bouldering-group-params.dto';
import { CreateBoulderingGroupDto } from './dto/in/body/create-bouldering-group.dto';
import { BoulderingGroupDto } from '../bouldering/dto/out/bouldering-group.dto';
import { BoulderingGroupMapper } from '../shared/mappers/bouldering-group.mapper';
import { DeleteBoulderingGroupParamsDto } from './dto/in/params/delete-bouldering-group-params.dto';
import { DeleteBoulderingRoundParamsDto } from './dto/in/params/delete-bouldering-round-params.dto';
import { CountDto } from '../shared/dto/count.dto';
import { StartRoundsByTypeParamsDto } from './dto/in/params/start-rounds-by-type-params.dto';
import { BoulderingLimitedRoundMapper } from '../shared/mappers/bouldering-limited-round.mapper';
import { BoulderingLimitedRoundDto } from '../bouldering/dto/out/bouldering-limited-round.dto';
import { UpdateBoulderingRoundParamsDto } from './dto/in/params/update-bouldering-round-params.dto';
import { UpdateBoulderingRoundDto } from './dto/in/body/update-bouldering-round.dto';
import { InvalidResultError } from './errors/invalid-result.error';
import { GetBoulderingRoundsParamsDto } from './dto/in/params/get-bouldering-rounds-params.dto';
import { BoulderingRoundsByCategoryByTypeMapper } from '../shared/mappers/bouldering-rounds-by-category-by-type.mapper';
import { RoundByCategoryByTypeDto } from './dto/out/round-by-category-by-type.dto';
import { AssignJudgeToBoulderParamsDto } from './dto/in/params/assign-judge-to-boulder-params.dto';
import { RemoveJudgeAssignmentToBoulderParamsDto } from './dto/in/params/remove-judge-assignment-to-boulder-params.dto';
import { BoulderJudgeAuthorizationGuard } from './authorization/boulder-judge.authorization.guard';

@Controller('competitions')
@ApiTags('Competition')
export class CompetitionController {
  constructor(
    private readonly competitionService: CompetitionService,
    private readonly competitionRegistrationMapper: CompetitionRegistrationMapper,
    private readonly userMapper: UserMapper,
    private readonly boulderingRoundMapper: BoulderingRoundMapper,
    private readonly boulderingLimitedRoundMapper: BoulderingLimitedRoundMapper,
    private readonly boulderingResultMapper: BoulderingResultMapper,
    private readonly rankingMapper: RankingsMapper,
    private readonly boulderingRoundRankingMapper: BoulderingRoundRankingsMapper,
    private readonly boulderingRoundsByCategoryByTypeMapper: BoulderingRoundsByCategoryByTypeMapper,
    private readonly mapper: CompetitionMapper,
    private readonly paginationService: PaginationService,
    private readonly boulderMapper: BoulderMapper,
    private readonly boulderingGroupMapper: BoulderingGroupMapper,
  ) {}

  @Get()
  @ApiOkResponse({ type: CompetitionDto, isArray: true })
  @ApiOperation(GetOperationId(Competition.constructor.name, 'GetCompetitions'))
  async getCompetitions(
    @Pagination() offsetLimitRequest: OffsetLimitRequest,
    @Search(SearchCompetitionsDto) search: SearchQuery<Competition>,
    @Req() request: Request,
  ): Promise<CompetitionDto[]> {
    const offsetLimitResponse = await this.competitionService.getCompetitions(
      offsetLimitRequest,
      search,
    );

    this.paginationService.addPaginationHeaders(
      offsetLimitResponse,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      request.res!,
    );

    return this.mapper.mapArray(offsetLimitResponse.data);
  }

  @Get('/count')
  @ApiOkResponse({ type: CountDto })
  @ApiOperation(GetOperationId(Competition.constructor.name, 'Count'))
  async count(
    @Search(SearchCompetitionsDto) search: SearchQuery<Competition>,
  ): Promise<CountDto> {
    const count = await this.competitionService.count(search);

    return {
      count,
    };
  }

  @Post()
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @UseGuards(AuthGuard('jwt'), AuthenticationGuard)
  @ApiOkResponse({ type: CompetitionDto })
  @ApiOperation(GetOperationId(Competition.name, 'CreateCompetition'))
  async create(
    @Body() dto: CreateCompetitionDTO,
    @GetUser() owner: User,
  ): Promise<CompetitionDto> {
    const competition = await this.competitionService.create(dto, owner);
    return this.mapper.map(competition);
  }

  @Get('/:competitionId')
  @ApiOkResponse({ type: CompetitionDto })
  @ApiOperation(GetOperationId(Competition.name, 'GetCompetitionById'))
  async getById(
    @Param() params: GetCompetitionByIdParams,
  ): Promise<CompetitionDto> {
    const competition = await this.competitionService.getOrFail(
      params.competitionId,
    );

    return this.mapper.map(competition);
  }

  @Patch('/:competitionId')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), AuthenticationGuard, OrganizerAuthorizationGuard)
  @ApiOkResponse({ type: CompetitionDto })
  @ApiOperation(GetOperationId(Competition.name, 'UpdateCompetitionById'))
  async updateById(
    @Param() params: UpdateCompetitionByIdParamsDto,
    @Body() dto: UpdateCompetitionByIdDto,
  ): Promise<CompetitionDto> {
    const competition = await this.competitionService.updateById(
      params.competitionId,
      dto,
    );

    return this.mapper.map(competition);
  }

  @Put('/:competitionId/registrations/:userId')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), AuthenticationGuard, UserAuthorizationGuard)
  @ApiNoContentResponse()
  @ApiOperation(GetOperationId(Competition.name, 'Register'))
  @HttpCode(204)
  async register(@Param() params: RegisterParamsDto): Promise<void> {
    await this.competitionService.register(params.competitionId, params.userId);
  }

  @Get('/:competitionId/registrations')
  @ApiOkResponse({ isArray: true, type: CompetitionRegistrationDto })
  @ApiOperation(GetOperationId(Competition.name, 'GetRegistrations'))
  async getRegistrations(
    @Pagination() offsetLimitRequest: OffsetLimitRequest,
    @Param() params: GetCompetitionRegistrationsParamsDto,
    @Req() request: Request,
  ): Promise<CompetitionRegistrationDto[]> {
    const offsetLimitResponse = await this.competitionService.getRegistrations(
      offsetLimitRequest,
      params.competitionId,
    );

    this.paginationService.addPaginationHeaders(
      offsetLimitResponse,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      request.res!,
    );

    return this.competitionRegistrationMapper.mapArray(
      offsetLimitResponse.data,
    );
  }

  @Delete('/:competitionId/registrations/:userId')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), AuthenticationGuard, OrganizerAuthorizationGuard)
  @ApiNoContentResponse()
  @HttpCode(204)
  @ApiOperation(GetOperationId(Competition.name, 'RemoveRegistration'))
  async removeRegistration(
    @Param() params: RemoveRegistrationParamsDto,
  ): Promise<void> {
    await this.competitionService.removeRegistration(
      params.competitionId,
      params.userId,
    );
  }

  @Get('/:competitionId/jury-presidents')
  @ApiOkResponse({ isArray: true, type: UserDto })
  @ApiOperation(GetOperationId(Competition.name, 'GetJuryPresidents'))
  async getJuryPresidents(
    @Param() params: GetCompetitionJuryPresidentsParamsDto,
  ): Promise<UserDto[]> {
    const juryPresidents = await this.competitionService.getJuryPresidents(
      params.competitionId,
    );

    return this.userMapper.mapArray(juryPresidents);
  }

  @Put('/:competitionId/jury-presidents/:userId')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), AuthenticationGuard, OrganizerAuthorizationGuard)
  @ApiNoContentResponse()
  @ApiOperation(GetOperationId(Competition.name, 'AddJuryPresident'))
  @HttpCode(204)
  async addJuryPresident(
    @Param() params: AddJuryPresidentParamsDto,
  ): Promise<void> {
    await this.competitionService.addJuryPresident(
      params.competitionId,
      params.userId,
    );
  }

  @Delete('/:competitionId/jury-presidents/:userId')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), AuthenticationGuard, OrganizerAuthorizationGuard)
  @ApiNoContentResponse()
  @HttpCode(204)
  @ApiOperation(GetOperationId(Competition.name, 'RemoveJuryPresident'))
  async removeJuryPresident(
    @Param() params: RemoveJuryPresidentParamsDto,
  ): Promise<void> {
    await this.competitionService.removeJuryPresident(
      params.competitionId,
      params.userId,
    );
  }

  @Get('/:competitionId/judges')
  @ApiOkResponse({ isArray: true, type: UserDto })
  @ApiOperation(GetOperationId(Competition.name, 'GetJudges'))
  async getJudges(
    @Param() params: GetCompetitionJudgesParamsDto,
  ): Promise<UserDto[]> {
    const judges = await this.competitionService.getJudges(
      params.competitionId,
    );

    return this.userMapper.mapArray(judges);
  }

  @Put('/:competitionId/judges/:userId')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(
    AuthGuard('jwt'),
    AuthenticationGuard,
    OrGuard(OrganizerAuthorizationGuard, JuryPresidentAuthorizationGuard),
  )
  @ApiNoContentResponse()
  @ApiOperation(GetOperationId(Competition.name, 'AddJudge'))
  @HttpCode(204)
  async addJudge(@Param() params: AddJudgeParamsDto): Promise<void> {
    await this.competitionService.addJudge(params.competitionId, params.userId);
  }

  @Delete('/:competitionId/judges/:userId')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(
    AuthGuard('jwt'),
    AuthenticationGuard,
    OrGuard(OrganizerAuthorizationGuard, JuryPresidentAuthorizationGuard),
  )
  @ApiNoContentResponse()
  @HttpCode(204)
  @ApiOperation(GetOperationId(Competition.name, 'RemoveJudge'))
  async removeJudge(@Param() params: RemoveJudgeParamsDto): Promise<void> {
    await this.competitionService.removeJudge(
      params.competitionId,
      params.userId,
    );
  }

  @Get('/:competitionId/chief-route-setters')
  @ApiOkResponse({ isArray: true, type: UserDto })
  @ApiOperation(GetOperationId(Competition.name, 'GetChiefRouteSetters'))
  async getChiefRouteSetters(
    @Param() params: GetCompetitionChiefRouteSettersParamsDto,
  ): Promise<UserDto[]> {
    const chiefRouteSetters = await this.competitionService.getChiefRouteSetters(
      params.competitionId,
    );

    return this.userMapper.mapArray(chiefRouteSetters);
  }

  @Put('/:competitionId/chief-route-setters/:userId')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), AuthenticationGuard, OrganizerAuthorizationGuard)
  @ApiNoContentResponse()
  @ApiOperation(GetOperationId(Competition.name, 'AddChiefRouteSetter'))
  @HttpCode(204)
  async addChiefRouteSetter(
    @Param() params: AddChiefRouteSetterParamsDto,
  ): Promise<void> {
    await this.competitionService.addChiefRouteSetter(
      params.competitionId,
      params.userId,
    );
  }

  @Delete('/:competitionId/chief-route-setters/:userId')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), AuthenticationGuard, OrganizerAuthorizationGuard)
  @ApiNoContentResponse()
  @HttpCode(204)
  @ApiOperation(GetOperationId(Competition.name, 'RemoveChiefRouteSetter'))
  async removeChiefRouteSetter(
    @Param() params: RemoveChiefRouteSetterParamsDto,
  ): Promise<void> {
    await this.competitionService.removeChiefRouteSetter(
      params.competitionId,
      params.userId,
    );
  }

  @Get('/:competitionId/route-setters')
  @ApiOkResponse({ isArray: true, type: UserDto })
  @ApiOperation(GetOperationId(Competition.name, 'GetRouteSetters'))
  async getRouteSetters(
    @Param() params: GetCompetitionRouteSettersParamsDto,
  ): Promise<UserDto[]> {
    const routeSetters = await this.competitionService.getRouteSetters(
      params.competitionId,
    );

    return this.userMapper.mapArray(routeSetters);
  }

  @Put('/:competitionId/route-setters/:userId')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(
    AuthGuard('jwt'),
    AuthenticationGuard,
    OrGuard(OrganizerAuthorizationGuard, ChiefRouteSetterAuthorizationGuard),
  )
  @ApiNoContentResponse()
  @ApiOperation(GetOperationId(Competition.name, 'AddRouteSetter'))
  @HttpCode(204)
  async addRouteSetter(
    @Param() params: AddRouteSetterParamsDto,
  ): Promise<void> {
    await this.competitionService.addRouteSetter(
      params.competitionId,
      params.userId,
    );
  }

  @Delete('/:competitionId/route-setters/:userId')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(
    AuthGuard('jwt'),
    AuthenticationGuard,
    OrGuard(OrganizerAuthorizationGuard, ChiefRouteSetterAuthorizationGuard),
  )
  @ApiNoContentResponse()
  @HttpCode(204)
  @ApiOperation(GetOperationId(Competition.name, 'RemoveRouteSetter'))
  async removeRouteSetter(
    @Param() params: RemoveRouteSetterParamsDto,
  ): Promise<void> {
    await this.competitionService.removeRouteSetter(
      params.competitionId,
      params.userId,
    );
  }

  @Get('/:competitionId/technical-delegates')
  @ApiOkResponse({ isArray: true, type: UserDto })
  @ApiOperation(GetOperationId(Competition.name, 'GetTechnicalDelegates'))
  async getTechnicalDelegates(
    @Param() params: GetCompetitionTechnicalDelegatesParamsDto,
  ): Promise<UserDto[]> {
    const technicalDelegates = await this.competitionService.getTechnicalDelegates(
      params.competitionId,
    );

    return this.userMapper.mapArray(technicalDelegates);
  }

  @Put('/:competitionId/technical-delegates/:userId')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), AuthenticationGuard, OrganizerAuthorizationGuard)
  @ApiNoContentResponse()
  @ApiOperation(GetOperationId(Competition.name, 'AddTechnicalDelegate'))
  @HttpCode(204)
  async addTechnicalDelegate(
    @Param() params: AddTechnicalDelegateParamsDto,
  ): Promise<void> {
    await this.competitionService.addTechnicalDelegate(
      params.competitionId,
      params.userId,
    );
  }

  @Delete('/:competitionId/technical-delegates/:userId')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), AuthenticationGuard, OrganizerAuthorizationGuard)
  @ApiNoContentResponse()
  @HttpCode(204)
  @ApiOperation(GetOperationId(Competition.name, 'RemoveTechnicalDelegate'))
  async removeTechnicalDelegate(
    @Param() params: RemoveTechnicalDelegateParamsDto,
  ): Promise<void> {
    await this.competitionService.removeTechnicalDelegate(
      params.competitionId,
      params.userId,
    );
  }

  @Get('/:competitionId/organizers')
  @ApiOkResponse({ isArray: true, type: UserDto })
  @ApiOperation(GetOperationId(Competition.name, 'GetOrganizers'))
  async getOrganizers(
    @Param() params: GetCompetitionTechnicalDelegatesParamsDto,
  ): Promise<UserDto[]> {
    const organizers = await this.competitionService.getOrganizers(
      params.competitionId,
    );

    return this.userMapper.mapArray(organizers);
  }

  @Put('/:competitionId/organizers/:userId')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), AuthenticationGuard, OrganizerAuthorizationGuard)
  @ApiNoContentResponse()
  @ApiOperation(GetOperationId(Competition.name, 'AddOrganizer'))
  @HttpCode(204)
  async addOrganizer(@Param() params: AddOrganizerParamsDto): Promise<void> {
    await this.competitionService.addOrganizer(
      params.competitionId,
      params.userId,
    );
  }

  @Delete('/:competitionId/organizers/:userId')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), AuthenticationGuard, OrganizerAuthorizationGuard)
  @ApiNoContentResponse()
  @HttpCode(204)
  @ApiOperation(GetOperationId(Competition.name, 'RemoveOrganizer'))
  async removeOrganizer(
    @Param() params: RemoveOrganizerParamsDto,
  ): Promise<void> {
    await this.competitionService.removeOrganizer(
      params.competitionId,
      params.userId,
    );
  }

  @Post('/:competitionId/bouldering-rounds')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(
    AuthGuard('jwt'),
    AuthenticationGuard,
    JuryPresidentAuthorizationGuard,
  )
  @ApiCreatedResponse({
    type: BoulderingRoundDto,
  })
  @ApiOperation(GetOperationId(Competition.name, 'AddRound'))
  async addBoulderingRound(
    @Param() params: AddRoundParamsDto,
    @Body() dto: CreateBoulderingRoundDto,
  ): Promise<BoulderingRoundDto> {
    const round = await this.competitionService.addBoulderingRound(
      params.competitionId,
      dto,
    );

    return this.boulderingRoundMapper.map(round);
  }

  @Get('/:competitionId/bouldering-rounds')
  @ApiOkResponse({ type: RoundByCategoryByTypeDto })
  @ApiOperation(
    GetOperationId(Competition.name, 'GetBoulderingRoundsByCategoryByType'),
  )
  async getBoulderingRoundsByCategoryByType(
    @Param() params: GetBoulderingRoundsParamsDto,
  ): Promise<RoundByCategoryByTypeDto> {
    const roundsByCategoryByType = await this.competitionService.getBoulderingRoundsByCategoryByType(
      params.competitionId,
    );

    return this.boulderingRoundsByCategoryByTypeMapper.map(
      roundsByCategoryByType,
    );
  }

  @Patch('/:competitionId/bouldering-rounds/:roundId')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(
    AuthGuard('jwt'),
    AuthenticationGuard,
    JuryPresidentAuthorizationGuard,
  )
  @ApiOkResponse({ type: BoulderingLimitedRoundDto })
  @ApiOperation(GetOperationId(Competition.name, 'AddRound'))
  async updateBoulderingRound(
    @Param() params: UpdateBoulderingRoundParamsDto,
    @Body() dto: UpdateBoulderingRoundDto,
  ): Promise<BoulderingLimitedRoundDto> {
    const updatedRound = await this.competitionService.updateBoulderingRound(
      params.competitionId,
      params.roundId,
      dto,
    );

    return this.boulderingLimitedRoundMapper.map(updatedRound);
  }

  @Post(
    '/:competitionId/bouldering-rounds/:roundId/groups/:groupId/boulders/:boulderId/results',
  )
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(
    AuthGuard('jwt'),
    AuthenticationGuard,
    OrGuard(BoulderJudgeAuthorizationGuard, JuryPresidentAuthorizationGuard),
  )
  @ApiCreatedResponse({
    type: BoulderingResultDto,
  })
  @ApiOperation(GetOperationId(Competition.name, 'AddBoulderingResult'))
  async addResult(
    @Param() params: AddBoulderingResultParamsDto,
    @Body() dto: CreateBoulderingResultDto,
  ): Promise<BoulderingResultDto> {
    if (
      typeof dto.try === 'undefined' &&
      typeof dto.zone === 'undefined' &&
      typeof dto.top === 'undefined'
    ) {
      throw new InvalidResultError();
    }

    const result = await this.competitionService.addBoulderingResult(
      params.competitionId,
      params.roundId,
      params.groupId,
      params.boulderId,
      dto,
    );

    return this.boulderingResultMapper.map(result);
  }

  @Get('/:competitionId/rankings')
  @ApiOkResponse({ type: RankingsDto })
  @ApiOperation(GetOperationId(Competition.name, 'GetCompetitionRankings'))
  async getRankings(
    @Param() params: GetRankingsParamsDto,
  ): Promise<RankingsDto> {
    const rankings = await this.competitionService.getRankings(
      params.competitionId,
    );

    return this.rankingMapper.map(rankings);
  }

  @Get('/:competitionId/bouldering-rounds/:roundId/rankings')
  @ApiOkResponse({ type: BoulderingRoundRankingsDto })
  @ApiOperation(GetOperationId(Competition.name, 'GetBoulderingRoundRankings'))
  async getBoulderingRoundRankings(
    @Param() params: GetBoulderingRoundRankingsParamsDto,
  ): Promise<BoulderingRoundRankingsDto> {
    const rankings = await this.competitionService.getBoulderingRoundRankings(
      params.competitionId,
      params.roundId,
    );

    return this.boulderingRoundRankingMapper.map(rankings);
  }

  @Post('/:competitionId/bouldering-rounds/:roundId/groups/:groupId/boulders')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(
    AuthGuard('jwt'),
    AuthenticationGuard,
    JuryPresidentAuthorizationGuard,
  )
  @ApiCreatedResponse({ type: BoulderDto })
  @ApiOperation(GetOperationId(Competition.name, 'CreateBoulder'))
  async createBoulder(
    @Param() params: CreateBoulderParamsDto,
    @Body() dto: CreateBoulderDto,
  ): Promise<BoulderDto> {
    const boulder = await this.competitionService.createBoulder(
      params.competitionId,
      params.roundId,
      params.groupId,
      dto,
    );

    return this.boulderMapper.map(boulder);
  }

  @Delete(
    '/:competitionId/bouldering-rounds/:roundId/groups/:groupId/boulders/:boulderId',
  )
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(
    AuthGuard('jwt'),
    AuthenticationGuard,
    JuryPresidentAuthorizationGuard,
  )
  @ApiNoContentResponse()
  @ApiOperation(GetOperationId(Competition.name, 'DeleteBoulder'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBoulder(@Param() params: DeleteBoulderParamsDto): Promise<void> {
    await this.competitionService.deleteBoulder(
      params.competitionId,
      params.roundId,
      params.groupId,
      params.boulderId,
    );
  }

  @Post('/:competitionId/bouldering-rounds/:roundId/groups')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(
    AuthGuard('jwt'),
    AuthenticationGuard,
    JuryPresidentAuthorizationGuard,
  )
  @ApiCreatedResponse({ type: BoulderingGroupDto })
  @ApiOperation(GetOperationId(Competition.name, 'CreateBoulderingGroup'))
  async createGroup(
    @Param() params: CreateBoulderingGroupParamsDto,
    @Body() dto: CreateBoulderingGroupDto,
  ): Promise<BoulderingGroupDto> {
    const group = await this.competitionService.createBoulderingGroup(
      params.competitionId,
      params.roundId,
      dto,
    );

    return this.boulderingGroupMapper.map(group);
  }

  @Delete('/:competitionId/bouldering-rounds/:roundId')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(
    AuthGuard('jwt'),
    AuthenticationGuard,
    JuryPresidentAuthorizationGuard,
  )
  @ApiNoContentResponse()
  @ApiOperation(GetOperationId(Competition.name, 'DeleteBoulderingRound'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBoulderingRound(
    @Param() params: DeleteBoulderingRoundParamsDto,
  ): Promise<void> {
    await this.competitionService.deleteBoulderingRound(
      params.competitionId,
      params.roundId,
    );
  }

  @Delete('/:competitionId/bouldering-rounds/:roundId/groups/:groupId')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(
    AuthGuard('jwt'),
    AuthenticationGuard,
    JuryPresidentAuthorizationGuard,
  )
  @ApiNoContentResponse()
  @ApiOperation(GetOperationId(Competition.name, 'DeleteBoulderingGroup'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBoulderingGroup(
    @Param() params: DeleteBoulderingGroupParamsDto,
  ): Promise<void> {
    await this.competitionService.deleteBoulderingGroup(
      params.competitionId,
      params.roundId,
      params.groupId,
    );
  }

  @Patch('/:competitionId/start-qualifiers')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(
    AuthGuard('jwt'),
    AuthenticationGuard,
    JuryPresidentAuthorizationGuard,
  )
  @ApiOkResponse({ type: BoulderingLimitedRoundDto, isArray: true })
  @ApiOperation(GetOperationId(Competition.name, 'StartQualifiers'))
  async startQualifiers(
    @Param() params: StartRoundsByTypeParamsDto,
  ): Promise<BoulderingLimitedRoundDto[]> {
    const rounds = await this.competitionService.startQualifiers(
      params.competitionId,
    );

    return this.boulderingLimitedRoundMapper.mapArray(rounds);
  }

  @Patch('/:competitionId/start-semi-finals')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(
    AuthGuard('jwt'),
    AuthenticationGuard,
    JuryPresidentAuthorizationGuard,
  )
  @ApiOkResponse({ type: BoulderingLimitedRoundDto, isArray: true })
  @ApiOperation(GetOperationId(Competition.name, 'StartSemiFinals'))
  async startSemiFinals(
    @Param() params: StartRoundsByTypeParamsDto,
  ): Promise<BoulderingLimitedRoundDto[]> {
    const rounds = await this.competitionService.startSemiFinals(
      params.competitionId,
    );

    return this.boulderingLimitedRoundMapper.mapArray(rounds);
  }

  @Patch('/:competitionId/start-finals')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(
    AuthGuard('jwt'),
    AuthenticationGuard,
    JuryPresidentAuthorizationGuard,
  )
  @ApiOkResponse({ type: BoulderingLimitedRoundDto, isArray: true })
  @ApiOperation(GetOperationId(Competition.name, 'StartFinals'))
  async startFinals(
    @Param() params: StartRoundsByTypeParamsDto,
  ): Promise<BoulderingLimitedRoundDto[]> {
    const rounds = await this.competitionService.startFinals(
      params.competitionId,
    );

    return this.boulderingLimitedRoundMapper.mapArray(rounds);
  }

  @Put(
    '/:competitionId/bouldering-rounds/:roundId/groups/:groupId/boulders/:boulderId/judges/:userId',
  )
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(
    AuthGuard('jwt'),
    AuthenticationGuard,
    JuryPresidentAuthorizationGuard,
  )
  @ApiNoContentResponse()
  @ApiOperation(GetOperationId(Competition.name, 'AssignJudgeToBoulder'))
  @HttpCode(204)
  async assignJudgeToBoulder(
    @Param() params: AssignJudgeToBoulderParamsDto,
  ): Promise<void> {
    await this.competitionService.assignJudgeToBoulder(
      params.competitionId,
      params.roundId,
      params.groupId,
      params.boulderId,
      params.userId,
    );
  }

  @Delete(
    '/:competitionId/bouldering-rounds/:roundId/groups/:groupId/boulders/:boulderId/judges/:userId',
  )
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(
    AuthGuard('jwt'),
    AuthenticationGuard,
    JuryPresidentAuthorizationGuard,
  )
  @ApiNoContentResponse()
  @ApiOperation(
    GetOperationId(Competition.name, 'RemoveJudgeAssignmentToBoulder'),
  )
  @HttpCode(204)
  async removeJudgeAssignmentToBoulder(
    @Param() params: RemoveJudgeAssignmentToBoulderParamsDto,
  ): Promise<void> {
    await this.competitionService.removeJudgeAssignmentToBoulder(
      params.competitionId,
      params.roundId,
      params.groupId,
      params.boulderId,
      params.userId,
    );
  }
}
