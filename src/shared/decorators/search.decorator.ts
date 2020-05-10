import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';

import { FilterQuery, QueryOrder, QueryOrderMap } from 'mikro-orm';
import { plainToClass } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { ClassType } from 'class-transformer/ClassTransformer';
import { CustomValidationError } from '../errors/custom-validation.error';
import { BaseError } from '../errors/base.error';

export interface SearchOptions {
  mandatoryQuery: boolean;
}

export interface SearchQuery<T> {
  filter: FilterQuery<T>;
  order: QueryOrderMap;
}

class MissingQuery extends BadRequestException implements BaseError {
  constructor() {
    super('Missing mandatory query');
  }

  code = 'MISSING_QUERY';
}

class InvalidQuery extends BadRequestException implements BaseError {
  constructor() {
    super('Invalid query');
  }

  code = 'INVALID_QUERY';
}

async function getFilter<Dto, T>(
  query?: string,
  dto?: ClassType<Dto>,
  options?: SearchOptions,
): Promise<FilterQuery<T>> {
  if (typeof dto === 'undefined') {
    return {};
  }

  if (typeof query === 'undefined') {
    if (options?.mandatoryQuery) {
      throw new MissingQuery();
    }

    return {};
  }

  let data;

  try {
    data = JSON.parse(query);
  } catch (err) {
    throw new InvalidQuery();
  }

  const pagination = plainToClass(dto, data);

  try {
    await validateOrReject(pagination, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    return data;
  } catch (err) {
    throw new CustomValidationError(err);
  }
}

function getOrderKey(key?: string): QueryOrder {
  const defaultOrder = QueryOrder.asc;

  if (typeof key === 'string') {
    key = key.toLowerCase();
  } else {
    return defaultOrder;
  }

  if (key === QueryOrder.asc || key === QueryOrder.desc) {
    return key;
  }

  return defaultOrder;
}

function getOrder(sort?: string, order?: string): QueryOrderMap {
  if (typeof sort !== 'string') {
    return {};
  }

  const orderKeys = typeof order === 'string' ? order.split(',') : [];

  return sort.split(',').reduce<QueryOrderMap>((order, sortKey, index) => {
    order[sortKey] = getOrderKey(orderKeys[index]);
    return order;
  }, {});
}

export function Search<Entity, Dto>(
  dto?: ClassType<Dto>,
  options?: SearchOptions,
): ParameterDecorator {
  return createParamDecorator(
    async (
      data: unknown,
      ctx: ExecutionContext,
    ): Promise<SearchQuery<Entity>> => {
      const { query } = ctx.switchToHttp().getRequest();

      return {
        filter: await getFilter<Dto, Entity>(query.q, dto, options),
        order: getOrder(query.sort, query.order),
      };
    },
  )();
}
