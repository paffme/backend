import { Injectable } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class ApiStatus {
  @ApiProperty()
  startedAt!: Date;

  @ApiProperty()
  uptime!: number;
}

@Injectable()
export class AppService {
  private readonly startedAt: Date;

  constructor() {
    this.startedAt = new Date();
  }

  root(): ApiStatus {
    return {
      startedAt: this.startedAt,
      uptime: process.uptime(),
    };
  }
}
