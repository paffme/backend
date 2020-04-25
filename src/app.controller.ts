import { Get, Controller } from '@nestjs/common';
import { ApiStatus, AppService } from './app.service';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@Controller()
@ApiTags('API')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOkResponse({
    type: ApiStatus,
  })
  root(): ApiStatus {
    return this.appService.root();
  }
}
