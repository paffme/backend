import { Boulder } from '../../../bouldering/boulder/boulder.entity';
import { HoldsRecognitionDoneEventPayload } from '../../../bouldering/boulder/boulder.service';

export class HoldsRecognitionDoneEventDto {
  boulderId: typeof Boulder.prototype.id;
  boundingBoxes: typeof Boulder.prototype.boundingBoxes;

  constructor(payload: HoldsRecognitionDoneEventPayload) {
    this.boulderId = payload.boulderId;
    this.boundingBoxes = payload.boundingBoxes;
  }
}
