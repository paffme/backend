import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CompetitionDto } from './dto/out/competition.dto';
import { AllowedSystemRoles } from '../shared/decorators/roles.decorator';
import { SystemRole } from '../user/user-role.enum';
import { AuthGuard } from '@nestjs/passport';
import { SystemRoleGuard } from '../shared/guards/system-role.guard';
import {
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { GetOperationId } from '../shared/utils/get-operation-id.helper';
import { CompetitionService } from './competition.service';
import { CreateCompetitionDTO } from './dto/in/body/create-competition.dto';
import { RegisterParamsDto } from './dto/in/params/register-params.dto';
import { CreateCompetitionRegistrationDto } from './dto/in/body/create-competition-registration.dto';
import { CompetitionRegistrationDto } from './dto/out/competition-registration.dto';
import { Competition } from './competition.entity';
import { CompetitionRegistrationMapper } from '../shared/mappers/competition-registration.mapper';
import { GetCompetitionRegistrationsParamsDto } from './dto/in/params/get-competition-registrations-params.dto';
import { UserDto } from '../user/dto/user.dto';
import { UserMapper } from '../shared/mappers/user.mapper';
import { GetCompetitionJuryPresidentsParamsDto } from './dto/in/params/get-competition-jury-presidents-params.dto';
import { GetCompetitionJudgesParamsDto } from './dto/in/params/get-competition-judges-params.dto';
import { GetCompetitionChiefRouteSettersParamsDto } from './dto/in/params/get-competition-chief-route-setters-params.dto';
import { GetCompetitionRouteSettersParamsDto } from './dto/in/params/get-competition-route-setters-params.dto';
import { GetCompetitionTechnicalDelegatesParamsDto } from './dto/in/params/get-competition-technical-delegates-params.dto';
import { AddJuryPresidentParamsDto } from './dto/in/params/add-jury-president-params.dto';
import { AddJuryPresidentDto } from './dto/in/body/add-jury-president.dto';
import { AddJudgeParamsDto } from './dto/in/params/add-judge-params.dto';
import { AddJudgeDto } from './dto/in/body/add-judge.dto';
import { AddChiefRouteSetterParamsDto } from './dto/in/params/add-chief-route-setter-params.dto';
import { AddChiefRouteSetterDto } from './dto/in/body/add-chief-route-setter.dto';
import { AddRouteSetterParamsDto } from './dto/in/params/add-route-setter-params.dto';
import { AddRouteSetterDto } from './dto/in/body/add-route-setter.dto';
import { AddTechnicalDelegateParamsDto } from './dto/in/params/add-technical-delegate-params.dto';
import { AddTechnicalDelegateDto } from './dto/in/body/add-technical-delegate.dto';

@Controller('competitions')
export class CompetitionController {
  constructor(
    private readonly competitionService: CompetitionService,
    private readonly competitionRegistrationMapper: CompetitionRegistrationMapper,
    private readonly userMapper: UserMapper,
  ) {}

  @Get()
  @ApiOkResponse({ type: CompetitionDto, isArray: true })
  @ApiOperation(
    GetOperationId(CompetitionDto.constructor.name, 'GetCompetitions'),
  )
  async getAll(): Promise<CompetitionDto[]> {
    const competitions = await this.competitionService.getAll();
    return this.competitionService.mapper.mapArray(competitions);
  }

  @Post()
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @UseGuards(AuthGuard('jwt'), SystemRoleGuard)
  @ApiOkResponse({ type: CompetitionDto })
  @ApiOperation(
    GetOperationId(Competition.constructor.name, 'CreateCompetition'),
  )
  async create(@Body() dto: CreateCompetitionDTO): Promise<CompetitionDto> {
    const competition = await this.competitionService.create(dto);
    return this.competitionService.mapper.map(competition);
  }

  @Post('/:competitionId/registrations')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @UseGuards(AuthGuard('jwt'), SystemRoleGuard)
  @ApiNoContentResponse()
  @ApiOperation(GetOperationId(Competition.constructor.name, 'Register'))
  @HttpCode(204)
  async register(
    @Param() params: RegisterParamsDto,
    @Body() dto: CreateCompetitionRegistrationDto,
  ): Promise<void> {
    await this.competitionService.register(params.competitionId, dto);
  }

  @Get('/:competitionId/registrations')
  @ApiOkResponse({ isArray: true, type: CompetitionRegistrationDto })
  @ApiOperation(
    GetOperationId(Competition.constructor.name, 'GetRegistrations'),
  )
  async getRegistrations(
    @Param() params: GetCompetitionRegistrationsParamsDto,
  ): Promise<CompetitionRegistrationDto[]> {
    const competitionRegistrations = await this.competitionService.getRegistrations(
      params.competitionId,
    );

    return this.competitionRegistrationMapper.mapArray(
      competitionRegistrations,
    );
  }

  @Get('/:competitionId/jury-presidents')
  @ApiOkResponse({ isArray: true, type: UserDto })
  @ApiOperation(
    GetOperationId(Competition.constructor.name, 'GetJuryPresidents'),
  )
  async getJuryPresidents(
    @Param() params: GetCompetitionJuryPresidentsParamsDto,
  ): Promise<UserDto[]> {
    const juryPresidents = await this.competitionService.getJuryPresidents(
      params.competitionId,
    );

    return this.userMapper.mapArray(juryPresidents);
  }

  @Post('/:competitionId/jury-presidents')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @UseGuards(AuthGuard('jwt'), SystemRoleGuard)
  @ApiNoContentResponse()
  @ApiOperation(
    GetOperationId(Competition.constructor.name, 'AddJuryPresident'),
  )
  @HttpCode(204)
  async addJuryPresident(
    @Param() params: AddJuryPresidentParamsDto,
    @Body() dto: AddJuryPresidentDto,
  ): Promise<void> {
    await this.competitionService.addJuryPresident(params.competitionId, dto);
  }

  @Get('/:competitionId/judges')
  @ApiOkResponse({ isArray: true, type: UserDto })
  @ApiOperation(GetOperationId(Competition.constructor.name, 'GetJudges'))
  async getJudges(
    @Param() params: GetCompetitionJudgesParamsDto,
  ): Promise<UserDto[]> {
    const judges = await this.competitionService.getJudges(
      params.competitionId,
    );

    return this.userMapper.mapArray(judges);
  }

  @Post('/:competitionId/judges')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @UseGuards(AuthGuard('jwt'), SystemRoleGuard)
  @ApiNoContentResponse()
  @ApiOperation(GetOperationId(Competition.constructor.name, 'AddJudge'))
  @HttpCode(204)
  async addJudge(
    @Param() params: AddJudgeParamsDto,
    @Body() dto: AddJudgeDto,
  ): Promise<void> {
    await this.competitionService.addJudge(params.competitionId, dto);
  }

  @Get('/:competitionId/chief-route-setters')
  @ApiOkResponse({ isArray: true, type: UserDto })
  @ApiOperation(
    GetOperationId(Competition.constructor.name, 'GetChiefRouteSetters'),
  )
  async getChiefRouteSetters(
    @Param() params: GetCompetitionChiefRouteSettersParamsDto,
  ): Promise<UserDto[]> {
    const chiefRouteSetters = await this.competitionService.getChiefRouteSetters(
      params.competitionId,
    );

    return this.userMapper.mapArray(chiefRouteSetters);
  }

  @Post('/:competitionId/chief-route-setters')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @UseGuards(AuthGuard('jwt'), SystemRoleGuard)
  @ApiNoContentResponse()
  @ApiOperation(
    GetOperationId(Competition.constructor.name, 'AddChiefRouteSetter'),
  )
  @HttpCode(204)
  async addChiefRouteSetter(
    @Param() params: AddChiefRouteSetterParamsDto,
    @Body() dto: AddChiefRouteSetterDto,
  ): Promise<void> {
    await this.competitionService.addChiefRouteSetter(
      params.competitionId,
      dto,
    );
  }

  @Get('/:competitionId/route-setters')
  @ApiOkResponse({ isArray: true, type: UserDto })
  @ApiOperation(GetOperationId(Competition.constructor.name, 'GetRouteSetters'))
  async getRouteSetters(
    @Param() params: GetCompetitionRouteSettersParamsDto,
  ): Promise<UserDto[]> {
    const routeSetters = await this.competitionService.getRouteSetters(
      params.competitionId,
    );

    return this.userMapper.mapArray(routeSetters);
  }

  @Post('/:competitionId/route-setters')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @UseGuards(AuthGuard('jwt'), SystemRoleGuard)
  @ApiNoContentResponse()
  @ApiOperation(GetOperationId(Competition.constructor.name, 'AddRouteSetter'))
  @HttpCode(204)
  async addRouteSetter(
    @Param() params: AddRouteSetterParamsDto,
    @Body() dto: AddRouteSetterDto,
  ): Promise<void> {
    await this.competitionService.addRouteSetter(params.competitionId, dto);
  }

  @Get('/:competitionId/technical-delegates')
  @ApiOkResponse({ isArray: true, type: UserDto })
  @ApiOperation(
    GetOperationId(Competition.constructor.name, 'GetTechnicalDelegates'),
  )
  async getTechnicalDelegates(
    @Param() params: GetCompetitionTechnicalDelegatesParamsDto,
  ): Promise<UserDto[]> {
    const technicalDelegates = await this.competitionService.getTechnicalDelegates(
      params.competitionId,
    );

    return this.userMapper.mapArray(technicalDelegates);
  }

  @Post('/:competitionId/technical-delegates')
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @UseGuards(AuthGuard('jwt'), SystemRoleGuard)
  @ApiNoContentResponse()
  @ApiOperation(
    GetOperationId(Competition.constructor.name, 'AddTechnicalDelegate'),
  )
  @HttpCode(204)
  async addTechnicalDelegate(
    @Param() params: AddTechnicalDelegateParamsDto,
    @Body() dto: AddTechnicalDelegateDto,
  ): Promise<void> {
    await this.competitionService.addTechnicalDelegate(
      params.competitionId,
      dto,
    );
  }
}
