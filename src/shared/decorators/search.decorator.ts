import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';

import { FilterQuery, QueryOrder, QueryOrderMap } from 'mikro-orm';
import { plainToClass } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { ClassType } from 'class-transformer/ClassTransformer';
import { FilterValue } from 'mikro-orm/dist/typings';

export interface SearchOptions {
  mandatoryQuery: boolean;
}

export interface SearchQuery<T> {
  filter: FilterQuery<T>;
  order: QueryOrderMap;
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
      throw new BadRequestException('Missing mandatory query');
    }

    return {};
  }

  let data;

  try {
    data = JSON.parse(query);
  } catch (err) {
    throw new BadRequestException('Invalid query');
  }

  const pagination = plainToClass(dto, data);

  await validateOrReject(pagination, {
    whitelist: true,
  });

  return data;
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
