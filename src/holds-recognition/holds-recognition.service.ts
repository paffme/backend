import { Injectable } from '@nestjs/common';
import { promisify } from 'util';
import { exec } from 'child_process';
import { ConfigurationService } from '../shared/configuration/configuration.service';
import * as uuid from 'uuid';
import { promises as fs } from 'fs';
import { BoundingBox } from '../bouldering/boulder/boulder.entity';

const execAsync = promisify(exec);

@Injectable()
export class HoldsRecognitionService {
  private readonly weightsPath: string;
  private readonly detectionScriptPath: string;
  private readonly detectionTmpStoragePath: string;

  constructor(configurationService: ConfigurationService) {
    this.weightsPath = configurationService.get(
      'HOLDS_RECOGNITION_WEIGHTS_PATH',
    );

    this.detectionScriptPath = configurationService.get(
      'HOLDS_RECOGNITION_SCRIPT_PATH',
    );

    this.detectionTmpStoragePath = configurationService.get(
      'HOLDS_RECOGNITION_TMP_STORAGE_PATH',
    );
  }

  async detect(imgPath: string): Promise<BoundingBox[]> {
    const tmpFile = `${this.detectionTmpStoragePath}/${uuid.v4()}.tmp`;

    await execAsync(
      `python3 ${this.detectionScriptPath} export --weights=${this.weightsPath} --image=${imgPath} --file_save=${tmpFile}`,
    );

    const fileContent = await fs.readFile(tmpFile);
    await fs.unlink(tmpFile);

    return JSON.parse(fileContent.toString());
  }
}
