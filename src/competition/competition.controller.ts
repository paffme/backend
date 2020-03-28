import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CompetitionDto } from './dto/competition.dto';
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
import { CreateCompetitionDTO } from './dto/create-competition.dto';
import { RegisterParamsDto } from './dto/register-params.dto';
import { CreateCompetitionRegistrationDto } from './dto/create-competition-registration.dto';
import { CompetitionRegistrationDto } from './dto/out/competition-registration.dto';
import { Competition } from './competition.entity';
import { CompetitionRegistrationMapper } from '../shared/mappers/competition-registration.mapper';
import { GetUserCompetitionRegistrationsParamsDto } from '../user/dto/in/get-user-competition-registrations-params.dto';
import { GetCompetitionRegistrationsParamsDto } from './dto/in/get-competition-registrations-params.dto';

@Controller('competitions')
export class CompetitionController {
  constructor(
    private readonly competitionService: CompetitionService,
    private readonly competitionRegistrationMapper: CompetitionRegistrationMapper,
  ) {}

  @Get()
  @ApiOkResponse({ type: CompetitionDto, isArray: true })
  @ApiOperation(
    GetOperationId(CompetitionDto.constructor.name, 'GetCompetitions'),
  )
  async getCompetitions(): Promise<CompetitionDto[]> {
    const competitions = await this.competitionService.getCompetitions();
    return this.competitionService.mapper.mapArray(competitions);
  }

  @Post()
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @UseGuards(AuthGuard('jwt'), SystemRoleGuard)
  @ApiOkResponse({ type: CompetitionDto })
  @ApiOperation(
    GetOperationId(Competition.constructor.name, 'CreateCompetition'),
  )
  async createCompetition(
    @Body() dto: CreateCompetitionDTO,
  ): Promise<CompetitionDto> {
    const competition = await this.competitionService.createCompetition(dto);
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
  async getCompetitionRegistrations(
    @Param() params: GetCompetitionRegistrationsParamsDto,
  ): Promise<CompetitionRegistrationDto[]> {
    const competitionRegistrations = await this.competitionService.getCompetitionRegistrations(
      params.competitionId,
    );

    return this.competitionRegistrationMapper.mapArray(
      competitionRegistrations,
    );
  }
}
