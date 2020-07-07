import { Module } from '@nestjs/common';
import { HoldsRecognitionService } from './holds-recognition.service';

@Module({
  controllers: [],
  providers: [HoldsRecognitionService],
  exports: [HoldsRecognitionService],
})
export class HoldsRecognitionModule {}
