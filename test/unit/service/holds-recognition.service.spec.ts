import { Test } from '@nestjs/testing';
import { ConfigurationService } from '../../../src/shared/configuration/configuration.service';
import { HoldsRecognitionService } from '../../../src/holds-recognition/holds-recognition.service';
import { promises as fs } from 'fs';
import { BoundingBoxType } from '../../../src/bouldering/boulder/boulder.entity';

describe('Holds recognition service (unit)', () => {
  let holdsRecognitionService: HoldsRecognitionService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ConfigurationService, HoldsRecognitionService],
    }).compile();

    holdsRecognitionService = module.get(HoldsRecognitionService);
  });

  it('detects holds', async () => {
    const readFileSpy = jest.spyOn(fs, 'readFile');
    const unlinkSpy = jest.spyOn(fs, 'unlink');
    // const execSpy = jest.spyOn(child_process, 'exec');
    const boundingBoxes = await holdsRecognitionService.detect('imgPath');
    expect(boundingBoxes).toEqual([
      {
        type: BoundingBoxType.NORMAL,
        coordinates: [1, 2, 3, 4],
      },
    ]);
    expect(readFileSpy).toHaveBeenCalledTimes(1);
    expect(unlinkSpy).toHaveBeenCalledTimes(1);
    expect(unlinkSpy).toHaveBeenCalledWith(readFileSpy.mock.calls[0][0]);
  });
});
