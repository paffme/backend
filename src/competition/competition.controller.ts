import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CompetitionDto } from './dto/competition.dto';
import { AllowedSystemRoles } from '../shared/decorators/roles.decorator';
import { SystemRole } from '../user/user-role.enum';
import { AuthGuard } from '@nestjs/passport';
import { SystemRoleGuard } from '../shared/guards/system-role.guard';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { GetOperationId } from '../shared/utils/get-operation-id.helper';
import { CompetitionService } from './competition.service';
import { CreateCompetitionDTO } from './dto/create-competition.dto';

@Controller('competitions')
export class CompetitionController {
  constructor(private readonly competitionService: CompetitionService) {}

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
    GetOperationId(CompetitionDto.constructor.name, 'CreateCompetition'),
  )
  async createCompetition(
    @Body() dto: CreateCompetitionDTO,
  ): Promise<CompetitionDto> {
    const competition = await this.competitionService.createCompetition(dto);
    return this.competitionService.mapper.map(competition);
  }
}
