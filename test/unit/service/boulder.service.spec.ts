import {
  BoulderService,
  HoldsRecognitionDoneEventPayload,
} from '../../../src/bouldering/boulder/boulder.service';
import { RepositoryMock, ServiceMock } from '../mocks/types';
import { getRepositoryToken } from 'nestjs-mikro-orm';
import {
  Boulder,
  BoundingBoxType,
} from '../../../src/bouldering/boulder/boulder.entity';
import { Test } from '@nestjs/testing';
import {
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { BoulderingGroup } from '../../../src/bouldering/group/bouldering-group.entity';
import { givenBoulderingGroup } from '../../fixture/bouldering-group.fixture';
import { CreateBoulderDto } from '../../../src/competition/dto/in/body/create-boulder.dto';
import { Collection } from 'mikro-orm';
import TestUtils from '../../utils';
import { UserService } from '../../../src/user/user.service';
import { User } from '../../../src/user/user.entity';
import { AlreadyJudgingBoulderConflictError } from '../../../src/bouldering/errors/already-judging-boulder-conflict.error';
import { JudgeNotAssignedError } from '../../../src/bouldering/errors/judge-not-found.error';
import { ConfigurationService } from '../../../src/shared/configuration/configuration.service';
import { HoldsRecognitionService } from '../../../src/holds-recognition/holds-recognition.service';
import { promises as fs } from 'fs';
import * as path from 'path';
import pEvent from 'p-event';
import { BoulderHasNoPhotoError } from '../../../src/competition/errors/boulder-has-no-photo.error';
import { LoggerModule } from 'nestjs-pino/dist';

const boulderRepositoryMock: RepositoryMock = {
  persistAndFlush: jest.fn(),
  removeAndFlush: jest.fn(),
  persistLater: jest.fn(),
  removeLater: jest.fn(),
  findOne: jest.fn(),
  flush: jest.fn(),
};

const userServiceMock: ServiceMock = {
  getOrFail: jest.fn(),
};

const holdsRecognitionServiceMock: ServiceMock = {
  detect: jest.fn(),
};

/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable sonarjs/no-identical-functions */

describe('Boulder service (unit)', () => {
  let boulderService: BoulderService;
  let configurationService: ConfigurationService;
  let utils: TestUtils;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BoulderService,
        {
          provide: getRepositoryToken(Boulder),
          useFactory: (): typeof boulderRepositoryMock => boulderRepositoryMock,
        },
        {
          provide: UserService,
          useValue: userServiceMock,
        },
        {
          provide: ConfigurationService,
          useClass: ConfigurationService,
        },
        {
          provide: HoldsRecognitionService,
          useValue: holdsRecognitionServiceMock,
        },
      ],
      imports: [LoggerModule.forRoot()],
    }).compile();

    boulderService = module.get(BoulderService);
    configurationService = module.get(ConfigurationService);
    utils = new TestUtils();
  });

  it('gets a boulder', async () => {
    const boulder = {};
    boulderRepositoryMock.findOne.mockImplementation(async () => boulder);

    const res = await boulderService.getOrFail(123);

    expect(res).toBe(boulder);
    expect(boulderRepositoryMock.findOne).toHaveBeenCalledTimes(1);
    expect(boulderRepositoryMock.findOne).toHaveBeenCalledWith(123);
  });

  it('throws not found when boulder do not exists', () => {
    boulderRepositoryMock.findOne.mockImplementation(async () => undefined);

    return expect(boulderService.getOrFail(123)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('creates many boulder at once', async () => {
    boulderRepositoryMock.persistLater.mockImplementation(() => undefined);
    boulderRepositoryMock.flush.mockImplementation(async () => undefined);

    const group = {
      boulders: {
        count() {
          return 0;
        },
      },
    } as BoulderingGroup;
    const boulders = await boulderService.createMany(group, 5);

    expect(boulders).toHaveLength(5);
    expect(boulderRepositoryMock.persistLater).toHaveBeenCalledTimes(5);

    for (const b of boulders) {
      expect(boulderRepositoryMock.persistLater).toHaveBeenCalledWith(b);
    }

    expect(boulderRepositoryMock.flush).toHaveBeenCalledTimes(1);
  });

  it('prevents creating multiple boulder at once if there already multiples existing', () => {
    const group = {
      boulders: {
        count() {
          return 1;
        },
      },
    } as BoulderingGroup;

    return expect(boulderService.createMany(group, 5)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('creates a boulder without an index in the dto and put the boulder at the end', async () => {
    const boulders: Boulder[] = [];
    const group = givenBoulderingGroup(undefined, boulders);

    const dto: CreateBoulderDto = {};
    boulderRepositoryMock.persistAndFlush.mockImplementation(
      async () => undefined,
    );

    const result = await boulderService.create(group, dto);

    expect(result).toBeInstanceOf(Boulder);
    expect(result.index).toEqual(0);
    expect(result.group).toBe(group);
    expect(boulderRepositoryMock.persistLater).toHaveBeenCalledTimes(1);
    expect(boulderRepositoryMock.persistLater).toHaveBeenCalledWith(boulders);
    expect(boulderRepositoryMock.persistAndFlush).toHaveBeenCalledTimes(1);
    expect(boulderRepositoryMock.persistAndFlush).toHaveBeenCalledWith(result);
  });

  it('creates a boulder with an index in the dto and shift other boulders', async () => {
    const boulders: Partial<Boulder>[] = [
      {
        index: 0,
      },
      {
        index: 1,
      },
    ];

    const group = givenBoulderingGroup(undefined, boulders);

    const dto: CreateBoulderDto = {
      index: 1,
    };

    boulderRepositoryMock.persistAndFlush.mockImplementation(
      async () => undefined,
    );

    const result = await boulderService.create(group, dto);

    expect(result).toBeInstanceOf(Boulder);
    expect(result.index).toEqual(1);
    expect(result.group).toBe(group);
    expect(boulders[0].index).toEqual(0);
    expect(boulders[1].index).toEqual(2);
    expect(boulderRepositoryMock.persistLater).toHaveBeenCalledTimes(1);
    expect(boulderRepositoryMock.persistLater).toHaveBeenCalledWith(boulders);
    expect(boulderRepositoryMock.persistAndFlush).toHaveBeenCalledTimes(1);
    expect(boulderRepositoryMock.persistAndFlush).toHaveBeenCalledWith(result);
  });

  it('throws when adding a boulder at an invalid index', () => {
    const group = givenBoulderingGroup(undefined, [
      {
        index: 0,
      },
    ]);

    const dto: CreateBoulderDto = {
      index: 2,
    };

    return expect(boulderService.create(group, dto)).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  it('removes a boulder', async () => {
    const boulders: Partial<Boulder>[] = [
      {
        id: utils.getRandomId(),
        index: 0,
      },
    ];

    boulderRepositoryMock.removeAndFlush.mockImplementation(
      async () => undefined,
    );

    const group = givenBoulderingGroup(undefined, boulders);

    await boulderService.remove(group, boulders[0].id!);

    expect(boulderRepositoryMock.removeAndFlush).toHaveBeenCalledTimes(1);
    expect(boulderRepositoryMock.removeAndFlush).toHaveBeenCalledWith(
      boulders[0],
    );
  });

  it('throws not found when trying to delete an unknown boulder', () => {
    const group = givenBoulderingGroup(undefined, []);

    return expect(boulderService.remove(group, 123)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deletes many boulders', async () => {
    const data = [{}, {}];

    const boulders = {
      async init(): Promise<unknown> {
        return {
          getItems(): unknown[] {
            return data;
          },
        };
      },
    };

    boulderRepositoryMock.removeLater.mockImplementation(() => undefined);
    boulderRepositoryMock.flush.mockImplementation(async () => undefined);

    const res = await boulderService.deleteMany(
      (boulders as unknown) as Collection<Boulder>,
    );

    expect(res).toBeUndefined();
    expect(boulderRepositoryMock.removeLater).toHaveBeenCalledTimes(
      data.length,
    );

    expect(boulderRepositoryMock.removeLater).toHaveBeenNthCalledWith(
      1,
      data[0],
    );

    expect(boulderRepositoryMock.removeLater).toHaveBeenNthCalledWith(
      2,
      data[1],
    );

    expect(boulderRepositoryMock.flush).toHaveBeenCalledTimes(1);
  });

  it('assigns a judge', async () => {
    const judge = {} as User;
    const contains = jest.fn().mockImplementation(() => false);
    const add = jest.fn().mockImplementation(() => undefined);

    const boulder = ({
      judges: {
        async init() {
          return {
            contains,
            add,
          };
        },
      },
    } as unknown) as Boulder;

    userServiceMock.getOrFail.mockImplementation(async () => judge);
    boulderRepositoryMock.persistAndFlush.mockImplementation(
      async () => undefined,
    );

    await boulderService.assignJudge(boulder, 1);

    expect(userServiceMock.getOrFail).toHaveBeenCalledTimes(1);
    expect(userServiceMock.getOrFail).toHaveBeenCalledWith(1);

    expect(contains).toHaveBeenCalledTimes(1);
    expect(contains).toHaveBeenCalledWith(judge);

    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith(judge);

    expect(boulderRepositoryMock.persistAndFlush).toHaveBeenCalledTimes(1);
    expect(boulderRepositoryMock.persistAndFlush).toHaveBeenCalledWith(boulder);
  });

  it('throws AlreadyJudgingBoulderConflictError when assigning an already assigned judge to a boulder', () => {
    const judge = {} as User;
    const contains = jest.fn().mockImplementation(() => true);

    const boulder = ({
      judges: {
        async init() {
          return {
            contains,
          };
        },
      },
    } as unknown) as Boulder;

    userServiceMock.getOrFail.mockImplementation(async () => judge);

    return expect(
      boulderService.assignJudge(boulder, 1),
    ).rejects.toBeInstanceOf(AlreadyJudgingBoulderConflictError);
  });

  it('removes a judge assignment', async () => {
    const judge = {} as User;
    const contains = jest.fn().mockImplementation(() => true);
    const remove = jest.fn().mockImplementation(() => undefined);

    const boulder = ({
      judges: {
        async init() {
          return {
            contains,
            remove,
          };
        },
      },
    } as unknown) as Boulder;

    userServiceMock.getOrFail.mockImplementation(async () => judge);
    boulderRepositoryMock.persistAndFlush.mockImplementation(
      async () => undefined,
    );

    await boulderService.removeJudgeAssignment(boulder, 1);

    expect(userServiceMock.getOrFail).toHaveBeenCalledTimes(1);
    expect(userServiceMock.getOrFail).toHaveBeenCalledWith(1);

    expect(contains).toHaveBeenCalledTimes(1);
    expect(contains).toHaveBeenCalledWith(judge);

    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledWith(judge);

    expect(boulderRepositoryMock.persistAndFlush).toHaveBeenCalledTimes(1);
    expect(boulderRepositoryMock.persistAndFlush).toHaveBeenCalledWith(boulder);
  });

  it('throws JudgeNotAssignedError when trying to remove a non-existant judge assignment', () => {
    const judge = {} as User;
    const contains = jest.fn().mockImplementation(() => false);

    const boulder = ({
      judges: {
        async init() {
          return {
            contains,
          };
        },
      },
    } as unknown) as Boulder;

    userServiceMock.getOrFail.mockImplementation(async () => judge);

    return expect(
      boulderService.removeJudgeAssignment(boulder, 1),
    ).rejects.toBeInstanceOf(JudgeNotAssignedError);
  });

  it('uploads a photo', async () => {
    const boulder = {
      id: utils.getRandomId(),
    } as Boulder;

    const photo = Buffer.from([]);
    const writeFileSpy = jest.spyOn(fs, 'writeFile');

    holdsRecognitionServiceMock.detect.mockImplementation(async () => [
      {
        type: BoundingBoxType.NORMAL,
        coordinates: [[1, 2, 3, 4]],
      },
    ]);

    boulderRepositoryMock.persistAndFlush.mockImplementation(
      async () => undefined,
    );

    boulderRepositoryMock.findOne.mockImplementation(async () => boulder);

    await boulderService.uploadPhoto(boulder, photo, 'jpg');
    const expectedPath = path.resolve(
      configurationService.get('BOULDER_STORAGE_PATH'),
      `${boulder.id}.jpg`,
    );

    return new Promise((resolve) => {
      process.nextTick(() => {
        expect(writeFileSpy).toHaveBeenCalledTimes(1);
        expect(writeFileSpy).toHaveBeenCalledWith(expectedPath, photo);

        expect(holdsRecognitionServiceMock.detect).toHaveBeenCalledTimes(1);
        expect(holdsRecognitionServiceMock.detect).toHaveBeenCalledWith(
          expectedPath,
        );

        expect(boulderRepositoryMock.persistAndFlush).toHaveBeenCalledTimes(2);
        expect(boulderRepositoryMock.persistAndFlush).toHaveBeenNthCalledWith(
          1,
          boulder,
        );
        expect(boulderRepositoryMock.persistAndFlush).toHaveBeenNthCalledWith(
          2,
          boulder,
        );

        resolve();
      });
    });
  });

  it('emits holdsRecognitionDone on photo upload', async () => {
    const boulder = {
      id: utils.getRandomId(),
    } as Boulder;

    const photo = Buffer.from([]);

    holdsRecognitionServiceMock.detect.mockImplementation(async () => [
      {
        type: BoundingBoxType.NORMAL,
        coordinates: [[1, 2, 3, 4]],
      },
    ]);

    boulderRepositoryMock.persistAndFlush.mockImplementation(
      async () => undefined,
    );

    boulderRepositoryMock.findOne.mockImplementation(async () => boulder);

    const [payload] = ((await Promise.all([
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      pEvent(boulderService, 'holdsRecognitionDone'),
      boulderService.uploadPhoto(boulder, photo, 'jpg'),
    ])) as unknown) as [HoldsRecognitionDoneEventPayload];

    expect(payload.boulderId).toEqual(boulder.id);
    expect(boulder.boundingBoxes).toEqual([
      {
        type: BoundingBoxType.NORMAL,
        coordinates: [[1, 2, 3, 4]],
      },
    ]);
  });

  it('removes the photo if it already exists', async () => {
    const unlinkSpy = jest.spyOn(fs, 'unlink');
    unlinkSpy.mockImplementation(async () => undefined);

    const boulder = {
      id: utils.getRandomId(),
      photo: 'photo-path.jpg',
    } as Boulder;

    const photo = Buffer.from([]);

    holdsRecognitionServiceMock.detect.mockImplementation(async () => [
      [1, 2, 3, 4],
    ]);

    boulderRepositoryMock.persistAndFlush.mockImplementation(
      async () => undefined,
    );

    boulderRepositoryMock.findOne.mockImplementation(async () => boulder);

    await boulderService.uploadPhoto(boulder, photo, 'jpg');

    expect(unlinkSpy).toHaveBeenCalledTimes(1);
    expect(unlinkSpy).toHaveBeenCalledWith('photo-path.jpg');

    return new Promise((resolve) => {
      process.nextTick(() => {
        expect(boulderRepositoryMock.persistAndFlush).toHaveBeenCalledTimes(3);
        expect(boulderRepositoryMock.persistAndFlush).toHaveBeenNthCalledWith(
          1,
          boulder,
        );
        expect(boulderRepositoryMock.persistAndFlush).toHaveBeenNthCalledWith(
          2,
          boulder,
        );
        expect(boulderRepositoryMock.persistAndFlush).toHaveBeenNthCalledWith(
          3,
          boulder,
        );
        resolve();
      });
    });
  });

  it('removes a photo', async () => {
    const unlinkSpy = jest.spyOn(fs, 'unlink');
    unlinkSpy.mockImplementation(async () => undefined);

    const boulder = ({
      id: utils.getRandomId(),
      photo: 'photo-path.jpg',
      boundingBoxes: [
        {
          type: BoundingBoxType.NORMAL,
          coordinates: [[1, 2, 3, 4]],
        },
      ],
      polygones: [],
    } as unknown) as Boulder;

    boulderRepositoryMock.persistAndFlush.mockImplementation(
      async () => undefined,
    );

    await boulderService.removePhoto(boulder);

    expect(boulder.photo).toBeUndefined();
    expect(boulder.boundingBoxes).toBeUndefined();
    expect(boulder.polygones).toBeUndefined();

    expect(unlinkSpy).toHaveBeenCalledTimes(1);
    expect(unlinkSpy).toHaveBeenCalledWith('photo-path.jpg');

    expect(boulderRepositoryMock.persistAndFlush).toHaveBeenCalledTimes(1);
    expect(boulderRepositoryMock.persistAndFlush).toHaveBeenCalledWith(boulder);
  });

  it('throws boulder has no photo error when deleting a boulder with no photo', () => {
    const boulder = {} as Boulder;
    return expect(boulderService.removePhoto(boulder)).rejects.toBeInstanceOf(
      BoulderHasNoPhotoError,
    );
  });
});
