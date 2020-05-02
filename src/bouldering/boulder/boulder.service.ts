import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from 'nestjs-mikro-orm';
import { EntityRepository } from 'mikro-orm';
import { Boulder } from './boulder.entity';
import { BoulderingGroup } from '../group/bouldering-group.entity';
import { CreateBoulderDto } from '../../competition/dto/in/body/create-boulder.dto';
import { validateIndex } from '../../shared/utils/indexing.helper';

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

    if (group.boulders.count() > 0) {
      throw new InternalServerErrorException(
        'Cannot add multiple boulders at once when there are already existing ones',
      );
    }

    for (let i = 0; i < amount; i++) {
      const boulder = new Boulder(group, i);
      this.boulderRepository.persistLater(boulder);
      boulders.push(boulder);
    }

    await this.boulderRepository.flush();

    return boulders;
  }

  async create(
    group: BoulderingGroup,
    dto: CreateBoulderDto,
  ): Promise<Boulder> {
    const boulders = await group.boulders.loadItems();
    const boulderIndex = dto.index ?? boulders.length;
    validateIndex(boulders, boulderIndex);

    const boulder = new Boulder(group, boulderIndex);

    // Shift other boulder index if necessary
    for (const b of boulders) {
      if (b.index >= boulderIndex) {
        b.index++;
      }
    }

    this.boulderRepository.persistLater(boulders);
    await this.boulderRepository.persistAndFlush(boulder);

    return boulder;
  }

  async remove(
    group: BoulderingGroup,
    boulderId: typeof Boulder.prototype.id,
  ): Promise<void> {
    const boulders = await group.boulders.init({
      where: {
        id: boulderId,
      },
    });

    const boulder = boulders.getItems()[0];

    if (!boulder) {
      throw new NotFoundException('Boulder not found');
    }

    await this.boulderRepository.removeAndFlush(boulder);
  }
}
