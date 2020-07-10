import { BaseAuthorizationService } from '../../shared/authorization/base.authorization.service';
import { Injectable } from '@nestjs/common';
import type { User } from '../../user/user.entity';
import { InjectRepository } from 'nestjs-mikro-orm';
import { EntityRepository } from 'mikro-orm';
import { Boulder } from '../../bouldering/boulder/boulder.entity';
import { BoulderNotFoundError } from '../../bouldering/errors/boulder-not-found.error';
import { isNil } from '../../shared/utils/objects.helper';

@Injectable()
export class BoulderJudgeAuthorizationService extends BaseAuthorizationService {
  constructor(
    @InjectRepository(Boulder)
    private readonly boulderRepository: EntityRepository<Boulder>,
  ) {
    super();
  }

  async authorize(
    authenticatedUserId: typeof User.prototype.id,
    boulderId: typeof Boulder.prototype.id,
  ): Promise<boolean> {
    const boulder = await this.boulderRepository.findOne(boulderId, ['judges']);

    if (isNil(boulder)) {
      throw new BoulderNotFoundError();
    }

    return (
      boulder.judges.getItems().findIndex((j) => j.id === authenticatedUserId) >
      -1
    );
  }
}
