import TestUtils from '../utils';
import { Test } from '@nestjs/testing';
import { BoulderingRoundService } from '../../src/bouldering/bouldering-round.service';
import { getRepositoryToken } from 'nestjs-mikro-orm';
import { BoulderingResultService } from '../../src/bouldering/bouldering-result.service';
import { BoulderingResult } from '../../src/bouldering/bouldering-result.entity';
import { RepositoryMock } from './mocks/types';

const boulderingResultRepositoryMock: RepositoryMock = {
  persistAndFlush: jest.fn(),
};

describe('Bouldering result service (unit)', () => {
  let boulderingResultService: BoulderingResultService;
  let utils: TestUtils;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BoulderingRoundService,
        {
          provide: getRepositoryToken(BoulderingResult),
          useFactory: () => boulderingResultRepositoryMock,
        },
      ],
    }).compile();

    boulderingResultService = module.get(BoulderingResultService);
    utils = new TestUtils();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
