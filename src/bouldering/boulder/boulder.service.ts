import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { InjectRepository } from 'nestjs-mikro-orm';
import { Collection, EntityRepository } from 'mikro-orm';
import { Boulder, BoundingBox } from './boulder.entity';
import { BoulderingGroup } from '../group/bouldering-group.entity';
import { CreateBoulderDto } from '../../competition/dto/in/body/create-boulder.dto';
import { validateIndex } from '../../shared/utils/indexing.helper';
import { BoulderNotFoundError } from '../errors/boulder-not-found.error';
import { User } from '../../user/user.entity';
import { AlreadyJudgingBoulderConflictError } from '../errors/already-judging-boulder-conflict.error';
import { UserService } from '../../user/user.service';
import { JudgeNotAssignedError } from '../errors/judge-not-found.error';
import path from 'path';
import { promises as fs } from 'fs';
import { BoulderHasNoPhotoError } from '../../competition/errors/boulder-has-no-photo.error';
import { ConfigurationService } from '../../shared/configuration/configuration.service';
import { HoldsRecognitionService } from '../../holds-recognition/holds-recognition.service';
import { EventEmitter as EE } from 'ee-ts';
import { AddBoulderHoldsDto } from '../../competition/dto/in/body/add-boulder-holds.dto';
import { RemoveBoulderHoldsDto } from '../../competition/dto/in/body/remove-boulder-holds.dto';

export interface HoldsRecognitionDoneEventPayload {
  boulderId: typeof Boulder.prototype.id;
  boundingBoxes: BoundingBox[];
}

export interface BoulderServiceEvents {
  holdsRecognitionDone(payload: HoldsRecognitionDoneEventPayload): void;
}

@Injectable()
export class BoulderService extends EE<BoulderServiceEvents> {
  private readonly logger = new Logger(BoulderService.name);

  constructor(
    @InjectRepository(Boulder)
    private readonly boulderRepository: EntityRepository<Boulder>,
    private readonly userService: UserService,
    private readonly configurationService: ConfigurationService,
    private readonly holdsRecognitionService: HoldsRecognitionService,
  ) {
    super();
  }

  async getOrFail(boulderId: typeof Boulder.prototype.id): Promise<Boulder> {
    const boulder = await this.boulderRepository.findOne(boulderId);

    if (!boulder) {
      throw new BoulderNotFoundError();
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
      throw new BoulderNotFoundError();
    }

    await this.boulderRepository.removeAndFlush(boulder);
  }

  async deleteMany(boulders: Collection<Boulder>): Promise<void> {
    const bouldersData = await boulders.init();

    for (const b of bouldersData.getItems()) {
      this.boulderRepository.removeLater(b);
    }

    return this.boulderRepository.flush();
  }

  async assignJudge(
    boulder: Boulder,
    judgeId: typeof User.prototype.id,
  ): Promise<void> {
    const [judge, judges] = await Promise.all([
      this.userService.getOrFail(judgeId),
      boulder.judges.init(),
    ]);

    if (judges.contains(judge)) {
      throw new AlreadyJudgingBoulderConflictError();
    }

    judges.add(judge);
    await this.boulderRepository.persistAndFlush(boulder);
  }

  async removeJudgeAssignment(
    boulder: Boulder,
    judgeId: typeof User.prototype.id,
  ): Promise<void> {
    const [judge, judges] = await Promise.all([
      this.userService.getOrFail(judgeId),
      boulder.judges.init(),
    ]);

    if (judges.contains(judge)) {
      judges.remove(judge);
      await this.boulderRepository.persistAndFlush(boulder);
    } else {
      throw new JudgeNotAssignedError();
    }
  }

  private startHoldsRecognitionInBackground(
    boulderId: typeof Boulder.prototype.id,
    photo: string,
  ): void {
    (async () => {
      try {
        const boundingBoxes = await this.holdsRecognitionService.detect(photo);
        const boulder = await this.getOrFail(boulderId);
        boulder.boundingBoxes = boulder.boundingBoxes || [];
        boulder.boundingBoxes.push(...boundingBoxes);
        await this.boulderRepository.persistAndFlush(boulder);

        this.emit('holdsRecognitionDone', {
          boulderId: boulder.id,
          boundingBoxes: boulder.boundingBoxes,
        });
      } catch (err) {
        this.logger.error('Error while doing holds recognition', err);
      }
    })();
  }

  async uploadPhoto(
    boulder: Boulder,
    photo: Buffer,
    extension: string,
  ): Promise<void> {
    if (typeof boulder.photo === 'string') {
      await this.removePhoto(boulder);
    }

    const filepath = path.resolve(
      this.configurationService.get('BOULDER_STORAGE_PATH'),
      `${boulder.id}.${extension}`,
    );

    await fs.writeFile(filepath, photo);
    boulder.photo = filepath;
    await this.boulderRepository.persistAndFlush(boulder);
    this.startHoldsRecognitionInBackground(boulder.id, boulder.photo);
  }

  async removePhoto(boulder: Boulder): Promise<void> {
    if (typeof boulder.photo !== 'string') {
      throw new BoulderHasNoPhotoError();
    }

    await fs.unlink(boulder.photo);
    boulder.photo = undefined;
    boulder.boundingBoxes = undefined;
    boulder.polygones = undefined;
    await this.boulderRepository.persistAndFlush(boulder);
  }

  async addHolds(boulder: Boulder, dto: AddBoulderHoldsDto): Promise<Boulder> {
    boulder.boundingBoxes = boulder.boundingBoxes || [];
    boulder.boundingBoxes.push(...dto.boundingBoxes);
    await this.boulderRepository.persistAndFlush(boulder);
    return boulder;
  }

  async removeHolds(
    boulder: Boulder,
    dto: RemoveBoulderHoldsDto,
  ): Promise<void> {
    if (Array.isArray(boulder.boundingBoxes)) {
      boulder.boundingBoxes = boulder.boundingBoxes.filter(
        (existingBoundingBox) => {
          const foundInDto = !!dto.boundingBoxes.find(
            (dtoB) =>
              dtoB.type === existingBoundingBox.type &&
              dtoB.coordinates.every(
                (c, index) => existingBoundingBox.coordinates[index] === c,
              ),
          );

          return !foundInDto;
        },
      );

      await this.boulderRepository.persistAndFlush(boulder);
    }
  }
}
