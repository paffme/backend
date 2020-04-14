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
    const roundIndex = dto.index ?? competition.boulderingRounds.count();

    const round = new BoulderingRound(
      dto.name,
      roundIndex,
      dto.quota,
      dto.boulders,
      dto.type,
      competition,
    );

    const rounds = await this.boulderingRoundRepository.find({
      competition,
    });

    for (const r of rounds) {
      if (r.index >= roundIndex) {
        r.index++;
        this.boulderingRoundRepository.persistLater(r);
      }
    }

    await this.boulderingRoundRepository.persistAndFlush(round);

    return round;
  }
}
