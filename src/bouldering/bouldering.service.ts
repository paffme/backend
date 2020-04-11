import { Injectable } from '@nestjs/common';
import { BaseService } from '../shared/base.service';
import { InjectRepository } from 'nestjs-mikro-orm';
import { EntityRepository } from 'mikro-orm';
import { BoulderingRound } from './bouldering-round.entity';
import { BoulderingResult } from './bouldering-result.entity';
import { BoulderingRoundDto } from './dto/out/bouldering-round.dto';
import { Competition } from '../competition/competition.entity';
import { CreateBoulderingRoundDto } from '../competition/dto/in/body/create-bouldering-round.dto';
import { BoulderingRoundMapper } from '../shared/mappers/bouldering-round.mapper';

@Injectable()
export class BoulderingService extends BaseService<
  BoulderingRound,
  BoulderingRoundDto
> {
  constructor(
    @InjectRepository(BoulderingRound)
    private readonly boulderingRoundRepository: EntityRepository<
      BoulderingRound
    >,
    @InjectRepository(BoulderingResult)
    private readonly boulderingResultRepository: EntityRepository<
      BoulderingResult
    >,
    mapper: BoulderingRoundMapper,
  ) {
    super(BoulderingRound.prototype, mapper);
  }

  async createRound(
    competition: Competition,
    dto: CreateBoulderingRoundDto,
  ): Promise<BoulderingRound> {
    const round = new BoulderingRound(
      dto.name,
      dto.index,
      dto.quota,
      dto.boulders,
      dto.type,
      competition,
    );

    await this.boulderingRoundRepository.persistAndFlush(round);

    return round;
  }
}
