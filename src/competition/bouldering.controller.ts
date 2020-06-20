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
  UseGuards,
} from '@nestjs/common';

import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { AllowedSystemRoles } from '../shared/decorators/allowed-system-roles.decorator';
import { SystemRole } from '../user/user-role.enum';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticationGuard } from '../shared/guards/authentication.guard';
import { GetOperationId } from '../shared/utils/get-operation-id.helper';
import { CompetitionService } from './competition.service';
import { Competition } from './competition.entity';
import { AllowedAppRoles } from '../shared/decorators/allowed-app-roles.decorator';
import { AppRoles } from '../app.roles';
import { AddRoundParamsDto } from './dto/in/params/add-round-params.dto';
import { JuryPresidentAuthorizationGuard } from './authorization/jury-president.authorization.guard';
import { BoulderingRoundDto } from '../bouldering/dto/out/bouldering-round.dto';
import { AddBoulderingResultParamsDto } from './dto/in/params/add-bouldering-result-params.dto';
import { BoulderingResultDto } from '../bouldering/dto/out/bouldering-result.dto';
import { CreateBoulderingRoundDto } from './dto/in/body/create-bouldering-round.dto';
import { CreateBoulderingResultDto } from './dto/in/body/create-bouldering-result.dto';
import { BoulderingRoundMapper } from '../shared/mappers/bouldering-round.mapper';
import { BoulderingResultMapper } from '../shared/mappers/bouldering-result.mapper';
import { OrGuard } from '../shared/guards/or.authorization.guard';
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
import { GetBouldersParamsDto } from './dto/in/params/get-boulders-params.dto';
import { GetBoulderingGroupsParamsDto } from './dto/in/params/get-bouldering-groups-params.dto';
import { BulkBoulderingResultsParamsDto } from './dto/in/params/bulk-bouldering-results-params.dto';
import { BulkBoulderingResultsDto } from './dto/in/body/bulk-bouldering-results.dto';
import { BoulderingGroupRankingsDto } from '../bouldering/dto/out/bouldering-group-rankings.dto';
import { GetBoulderingGroupRankingsParamsDto } from './dto/in/params/get-bouldering-group-rankings-params.dto';
import { BoulderingGroupRankingsMapper } from '../shared/mappers/bouldering-group-rankings.mapper';

@Controller('competitions')
@ApiTags('Bouldering')
export class BoulderingController {
  constructor(
    private readonly competitionService: CompetitionService,
    private readonly boulderingRoundMapper: BoulderingRoundMapper,
    private readonly boulderingLimitedRoundMapper: BoulderingLimitedRoundMapper,
    private readonly boulderingResultMapper: BoulderingResultMapper,
    private readonly boulderingRoundRankingMapper: BoulderingRoundRankingsMapper,
    private readonly boulderingRoundsByCategoryByTypeMapper: BoulderingRoundsByCategoryByTypeMapper,
    private readonly boulderMapper: BoulderMapper,
    private readonly boulderingGroupMapper: BoulderingGroupMapper,
    private readonly boulderingGroupRankingsMapper: BoulderingGroupRankingsMapper,
  ) {}

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
    '/:competitionId/bouldering-rounds/:roundId/groups/:groupId/bulk-results',
  )
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(
    AuthGuard('jwt'),
    AuthenticationGuard,
    JuryPresidentAuthorizationGuard,
  )
  @ApiCreatedResponse({
    type: BoulderingGroupRankingsDto,
  })
  @ApiOperation(GetOperationId(Competition.name, 'BulkBoulderingResults'))
  async bulkResults(
    @Param() params: BulkBoulderingResultsParamsDto,
    @Body() dto: BulkBoulderingResultsDto,
  ): Promise<BoulderingGroupRankingsDto> {
    const {
      rankings,
      type,
    } = await this.competitionService.bulkBoulderingResults(
      params.competitionId,
      params.roundId,
      params.groupId,
      dto,
    );

    return this.boulderingRoundRankingMapper.mapGroupRankings(rankings, type);
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

  @Get('/:competitionId/bouldering-rounds/:roundId/groups/:groupId/rankings')
  @ApiOkResponse({ type: BoulderingRoundRankingsDto })
  @ApiOperation(GetOperationId(Competition.name, 'GetBoulderingGroupRankings'))
  async getBoulderingGroupRankings(
    @Param() params: GetBoulderingGroupRankingsParamsDto,
  ): Promise<BoulderingGroupRankingsDto> {
    const rankings = await this.competitionService.getBoulderingGroupRankings(
      params.competitionId,
      params.roundId,
      params.groupId,
    );

    return this.boulderingGroupRankingsMapper.map(rankings);
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

  @Get('/:competitionId/bouldering-rounds/:roundId/groups/:groupId/boulders')
  @ApiOkResponse({ type: BoulderDto, isArray: true })
  @ApiOperation(GetOperationId(Competition.name, 'GetGroupBoulders'))
  async getGroupBoulders(
    @Param() params: GetBouldersParamsDto,
  ): Promise<BoulderDto[]> {
    const boulders = await this.competitionService.getGroupBoulders(
      params.competitionId,
      params.roundId,
      params.groupId,
    );

    return this.boulderMapper.mapArray(boulders);
  }

  @Get('/:competitionId/bouldering-rounds/:roundId/groups')
  @ApiOkResponse({ type: BoulderingGroupDto, isArray: true })
  @ApiOperation(GetOperationId(Competition.name, 'GetBoulderingGroups'))
  async getBoulderingGroups(
    @Param() params: GetBoulderingGroupsParamsDto,
  ): Promise<BoulderingGroupDto[]> {
    const groups = await this.competitionService.getBoulderingGroups(
      params.competitionId,
      params.roundId,
    );

    return this.boulderingGroupMapper.mapArray(groups);
  }
}
