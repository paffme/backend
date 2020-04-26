import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { OffsetLimitRequest } from '../pagination/pagination.service';
import {
  PAGE,
  PaginationParamsDto,
  PER_PAGE,
} from '../pagination/pagination-params.dto';

export const Pagination = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext): Promise<OffsetLimitRequest> => {
    const { params } = ctx.switchToHttp().getRequest();
    const pagination = plainToClass(PaginationParamsDto, params);
    await validateOrReject(pagination);

    return {
      offset: (pagination[PAGE] - 1) * pagination[PER_PAGE],
      limit: pagination[PER_PAGE],
    };
  },
);
