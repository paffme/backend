import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { OffsetLimitRequest } from '../pagination/pagination.service';
import {
  PAGE,
  PaginationQueriesDto,
  PER_PAGE,
} from '../pagination/pagination-queries.dto';
import { CustomValidationError } from '../errors/custom-validation.error';

export const Pagination = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext): Promise<OffsetLimitRequest> => {
    const { query } = ctx.switchToHttp().getRequest();
    const pagination = plainToClass(PaginationQueriesDto, query);

    try {
      await validateOrReject(pagination);

      return {
        offset: (pagination[PAGE] - 1) * pagination[PER_PAGE],
        limit: pagination[PER_PAGE],
      };
    } catch (err) {
      throw new CustomValidationError(err);
    }
  },
);
