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
  Redirect,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
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
import { GetBoulderingResultParamsDto } from './dto/in/params/get-bouldering-result-params.dto';
import { Response } from 'express';
import { GetBoulderingRoundRankingsPdfParamsDto } from './dto/in/params/get-bouldering-round-rankings-pdf-params.dto';
import { GetBoulderingGroupRankingsPdfParamsDto } from './dto/in/params/get-bouldering-group-rankings-pdf-params.dto';
import { GetBoulderingGroupParamsDto } from './dto/in/params/get-bouldering-group-params.dto';
import { JudgeAuthorizationGuard } from './authorization/judge.authorization.guard';
import { ChiefRouteSetterAuthorizationGuard } from './authorization/chief-route-setter.authorization.guard';
import { RouteSetterAuthorizationGuard } from './authorization/route-setter.authorization.guard';
import { UploadBoulderPhotoParamsDto } from './dto/in/params/upload-boulder-photo-params.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { InvalidContentTypeError } from './errors/invalid-content-type.error';
import multer from 'multer';
import * as path from 'path';
import { DeleteBoulderPhotoParamsDto } from './dto/in/params/delete-boulder-photo-params.dto';
import { GetBoulderPhotoParamsDto } from './dto/in/params/get-boulder-photo-params.dto';
import { ConfigurationService } from '../shared/configuration/configuration.service';
import { BoulderHasNoPhotoError } from './errors/boulder-has-no-photo.error';
import { HoldsDto } from './dto/out/holds.dto';
import { GetBoulderHoldsParamsDto } from './dto/in/params/get-boulder-holds-params.dto';
import { HoldsMapper } from '../shared/mappers/holds.mapper';
import { BoulderPhotoDto } from './dto/out/boulder-photo.dto';
import { AddBoulderHoldsParamsDto } from './dto/in/params/add-boulder-holds-params.dto';
import { AddBoulderHoldsDto } from './dto/in/body/add-boulder-holds.dto';
import { RemoveBoulderHoldsDto } from './dto/in/body/remove-boulder-holds.dto';

/* eslint-disable sonarjs/no-duplicate-string */

@Controller('competitions')
@ApiTags('Bouldering')
export class BoulderingController {
  constructor(
    private readonly competitionService: CompetitionService,
    private readonly boulderingRoundMapper: BoulderingRoundMapper,
    private readonly boulderingLimitedRoundMapper: BoulderingLimitedRoundMapper,
    private readonly boulderingResultMapper: BoulderingResultMapper,
    private readonly boulderingRoundRankingsMapper: BoulderingRoundRankingsMapper,
    private readonly boulderingRoundsByCategoryByTypeMapper: BoulderingRoundsByCategoryByTypeMapper,
    private readonly boulderMapper: BoulderMapper,
    private readonly boulderingGroupMapper: BoulderingGroupMapper,
    private readonly boulderingGroupRankingsMapper: BoulderingGroupRankingsMapper,
    private readonly configurationService: ConfigurationService,
    private readonly holdsMapper: HoldsMapper,
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
  @ApiOperation(GetOperationId(Competition.name, 'UpdateRound'))
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

  @Get('/:competitionId/bouldering-rounds/:roundId/groups/:groupId')
  @ApiOkResponse({
    type: BoulderingGroupDto,
  })
  @ApiOperation(GetOperationId(Competition.name, 'GetBoulderingGroup'))
  async getBoulderingGroup(
    @Param() params: GetBoulderingGroupParamsDto,
  ): Promise<BoulderingGroupDto> {
    const group = await this.competitionService.getBoulderingGroup(
      params.competitionId,
      params.roundId,
      params.groupId,
    );

    return this.boulderingGroupMapper.map(group);
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
    const rankings = await this.competitionService.bulkBoulderingResults(
      params.competitionId,
      params.roundId,
      params.groupId,
      dto,
    );

    return this.boulderingGroupRankingsMapper.map(rankings);
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

  @Get(
    '/:competitionId/bouldering-rounds/:roundId/groups/:groupId/boulders/:boulderId/results/:climberId',
  )
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(
    AuthGuard('jwt'),
    AuthenticationGuard,
    OrGuard(BoulderJudgeAuthorizationGuard, JuryPresidentAuthorizationGuard),
  )
  @ApiOkResponse({
    type: BoulderingResultDto,
  })
  @ApiOperation(GetOperationId(Competition.name, 'GetBoulderingResult'))
  async getResult(
    @Param() params: GetBoulderingResultParamsDto,
  ): Promise<BoulderingResultDto> {
    const result = await this.competitionService.getBoulderingResult(
      params.competitionId,
      params.roundId,
      params.groupId,
      params.boulderId,
      params.climberId,
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

    return this.boulderingRoundRankingsMapper.map(rankings);
  }

  @Get('/:competitionId/bouldering-rounds/:roundId/rankings/pdf')
  @ApiOkResponse()
  @ApiOperation(
    GetOperationId(Competition.name, 'GetBoulderingRoundRankingsPdf'),
  )
  async getBoulderingRoundRankingsPdf(
    @Param() params: GetBoulderingRoundRankingsPdfParamsDto,
    @Res() res: Response,
  ): Promise<void> {
    const pdf = await this.competitionService.getBoulderingRoundRankingsPdf(
      params.competitionId,
      params.roundId,
    );

    res.setHeader('Content-Type', 'application/pdf');
    pdf.pipe(res);
  }

  @Get('/:competitionId/bouldering-rounds/:roundId/groups/:groupId/rankings')
  @ApiOkResponse({ type: BoulderingGroupRankingsDto })
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

  @Get(
    '/:competitionId/bouldering-rounds/:roundId/groups/:groupId/rankings/pdf',
  )
  @ApiOkResponse()
  @ApiOperation(
    GetOperationId(Competition.name, 'GetBoulderingGroupRankingsPdf'),
  )
  async getBoulderingGroupRankingsPdf(
    @Param() params: GetBoulderingGroupRankingsPdfParamsDto,
    @Res() res: Response,
  ): Promise<void> {
    const pdf = await this.competitionService.getBoulderingGroupRankingsPdf(
      params.competitionId,
      params.roundId,
      params.groupId,
    );

    res.setHeader('Content-Type', 'application/pdf');
    pdf.pipe(res);
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

  @Put(
    '/:competitionId/bouldering-rounds/:roundId/groups/:groupId/boulders/:boulderId/photo',
  )
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(
    AuthGuard('jwt'),
    AuthenticationGuard,
    OrGuard(
      JuryPresidentAuthorizationGuard,
      JudgeAuthorizationGuard,
      ChiefRouteSetterAuthorizationGuard,
      RouteSetterAuthorizationGuard,
    ),
  )
  @ApiNoContentResponse()
  @ApiOperation(GetOperationId(Competition.name, 'UploadBoulderPhoto'))
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseInterceptors(
    FileInterceptor('photo', {
      limits: {
        files: 1,
        fileSize: 1.2e7,
      },
      storage: multer.memoryStorage(),
    }),
  )
  async uploadBoulderPhoto(
    @Param() params: UploadBoulderPhotoParamsDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<void> {
    if (!['image/jpg', 'image/jpeg', 'image/png'].includes(file.mimetype)) {
      throw new InvalidContentTypeError();
    }

    await this.competitionService.uploadBoulderPhoto(
      params.competitionId,
      params.roundId,
      params.groupId,
      params.boulderId,
      file.buffer,
      path.extname(file.originalname).substr(1),
    );
  }

  @Delete(
    '/:competitionId/bouldering-rounds/:roundId/groups/:groupId/boulders/:boulderId/photo',
  )
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(
    AuthGuard('jwt'),
    AuthenticationGuard,
    OrGuard(
      JuryPresidentAuthorizationGuard,
      JudgeAuthorizationGuard,
      ChiefRouteSetterAuthorizationGuard,
      RouteSetterAuthorizationGuard,
    ),
  )
  @ApiNoContentResponse()
  @ApiOperation(GetOperationId(Competition.name, 'DeleteBoulderPhoto'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBoulderPhoto(
    @Param() params: DeleteBoulderPhotoParamsDto,
  ): Promise<void> {
    await this.competitionService.deleteBoulderPhoto(
      params.competitionId,
      params.roundId,
      params.groupId,
      params.boulderId,
    );
  }

  @Get(
    '/:competitionId/bouldering-rounds/:roundId/groups/:groupId/boulders/:boulderId/photo',
  )
  @ApiOperation(GetOperationId(Competition.name, 'GetBoulderPhoto'))
  @ApiOkResponse({ type: BoulderPhotoDto })
  async getBoulderPhoto(
    @Param() params: GetBoulderPhotoParamsDto,
  ): Promise<BoulderPhotoDto> {
    const boulder = await this.competitionService.getBoulder(
      params.competitionId,
      params.roundId,
      params.groupId,
      params.boulderId,
    );

    if (typeof boulder.photo !== 'string') {
      throw new BoulderHasNoPhotoError();
    }

    return {
      url: `${this.configurationService.get(
        'BOULDER_STORAGE_URL',
      )}/${path.basename(boulder.photo)}`,
    };
  }

  @Get(
    '/:competitionId/bouldering-rounds/:roundId/groups/:groupId/boulders/:boulderId/holds',
  )
  @ApiOperation(GetOperationId(Competition.name, 'GetBoulderPhotoHolds'))
  @ApiOkResponse({ type: HoldsDto })
  async getBoulderHolds(
    @Param() params: GetBoulderHoldsParamsDto,
  ): Promise<HoldsDto> {
    const boulder = await this.competitionService.getBoulder(
      params.competitionId,
      params.roundId,
      params.groupId,
      params.boulderId,
    );

    return this.holdsMapper.map(boulder);
  }

  @Post(
    '/:competitionId/bouldering-rounds/:roundId/groups/:groupId/boulders/:boulderId/holds',
  )
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(
    AuthGuard('jwt'),
    AuthenticationGuard,
    OrGuard(
      JuryPresidentAuthorizationGuard,
      JudgeAuthorizationGuard,
      ChiefRouteSetterAuthorizationGuard,
      RouteSetterAuthorizationGuard,
    ),
  )
  @ApiOperation(GetOperationId(Competition.name, 'AddBoulderPhotoHolds'))
  @ApiCreatedResponse({ type: HoldsDto })
  async addBoulderHolds(
    @Param() params: AddBoulderHoldsParamsDto,
    @Body() dto: AddBoulderHoldsDto,
  ): Promise<HoldsDto> {
    const boulder = await this.competitionService.addBoulderHolds(
      params.competitionId,
      params.roundId,
      params.groupId,
      params.boulderId,
      dto,
    );

    return this.holdsMapper.map(boulder);
  }

  @Delete(
    '/:competitionId/bouldering-rounds/:roundId/groups/:groupId/boulders/:boulderId/holds',
  )
  @AllowedSystemRoles(SystemRole.Admin, SystemRole.User)
  @AllowedAppRoles(AppRoles.OWNER)
  @UseGuards(
    AuthGuard('jwt'),
    AuthenticationGuard,
    OrGuard(
      JuryPresidentAuthorizationGuard,
      JudgeAuthorizationGuard,
      ChiefRouteSetterAuthorizationGuard,
      RouteSetterAuthorizationGuard,
    ),
  )
  @ApiOperation(GetOperationId(Competition.name, 'RemoveBoulderHolds'))
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeBoulderHolds(
    @Param() params: AddBoulderHoldsParamsDto,
    @Body() dto: RemoveBoulderHoldsDto,
  ): Promise<void> {
    await this.competitionService.removeBoulderHolds(
      params.competitionId,
      params.roundId,
      params.groupId,
      params.boulderId,
      dto,
    );
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
