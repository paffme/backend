import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { OffsetLimitRequest } from '../pagination/pagination.service';
import {
  PAGE,
  PaginationQueriesDto,
  PER_PAGE,
} from '../pagination/pagination-queries.dto';

export const Pagination = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext): Promise<OffsetLimitRequest> => {
    const { query } = ctx.switchToHttp().getRequest();
    const pagination = plainToClass(PaginationQueriesDto, query);
    await validateOrReject(pagination);

    return {
      offset: (pagination[PAGE] - 1) * pagination[PER_PAGE],
      limit: pagination[PER_PAGE],
    };
  },
);
