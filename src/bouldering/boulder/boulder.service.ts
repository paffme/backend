import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from 'nestjs-mikro-orm';
import { EntityRepository } from 'mikro-orm';
import { Boulder } from './boulder.entity';
import { BoulderingRound } from '../round/bouldering-round.entity';
import { BoulderingGroup } from '../group/bouldering-group.entity';

@Injectable()
export class BoulderService {
  constructor(
    @InjectRepository(Boulder)
    private readonly boulderRepository: EntityRepository<Boulder>,
  ) {}

  async getOrFail(boulderId: typeof Boulder.prototype.id): Promise<Boulder> {
    const boulder = await this.boulderRepository.findOne(boulderId);

    if (!boulder) {
      throw new NotFoundException('Boulder not found');
    }

    return boulder;
  }

  async createMany(group: BoulderingGroup, amount: number): Promise<Boulder[]> {
    const boulders: Boulder[] = [];

    for (let i = 0; i < amount; i++) {
      const boulder = new Boulder(group, i);
      this.boulderRepository.persistLater(boulder);
      boulders.push(boulder);
    }

    await this.boulderRepository.flush();

    return boulders;
  }
}
