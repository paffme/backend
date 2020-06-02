import {
  Search,
  SearchOptions,
  SearchQuery,
} from '../../../src/shared/decorators/search.decorator';
import { BadRequestException, ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { ClassType } from 'class-transformer/ClassTransformer';
import { IsString, Min } from 'class-validator';
import { catchErrors } from './decorator.utils';
import { QueryOrder } from 'mikro-orm';

function getParamDecoratorFactory<T>(
  decorator: () => unknown,
  dto?: ClassType<unknown>,
  options?: SearchOptions,
): (data: unknown, ctx: Partial<ExecutionContext>) => Promise<SearchQuery<T>> {
  class Test {
    // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
    public test(@Search(dto, options) value: SearchQuery<T>): void {}
  }

  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Test, 'test');
  return args[Object.keys(args)[0]].factory;
}

function givenSearchDecorator<T, Dto>(
  query: Record<string, unknown>,
  dto?: ClassType<Dto>,
  options?: SearchOptions,
): Promise<SearchQuery<T>> {
  const factory = getParamDecoratorFactory<T>(Search, dto, options);

  return factory(null, {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    switchToHttp() {
      return {
        getRequest(): Record<string, unknown> {
          return {
            query,
          };
        },
      };
    },
  });
}

function givenEmptyClass(): ClassType<unknown> {
  return class Test {};
}

describe('Search decorator (unit)', () => {
  it('does not throw with no query by default', async () => {
    const res = await givenSearchDecorator(
      {
        q: undefined,
      },
      givenEmptyClass(),
    );

    expect(res.filter).toEqual({});
  });

  it('throws when there is a query but it is not parsable and the query is mandatory (1)', () => {
    return expect(
      givenSearchDecorator(
        {
          q: '',
        },
        givenEmptyClass(),
        {
          mandatoryQuery: true,
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when there is a query but it is not parsable and the query is mandatory (2)', () => {
    return expect(
      givenSearchDecorator(
        {
          q: undefined,
        },
        givenEmptyClass(),
        {
          mandatoryQuery: true,
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when the query is not valid', async () => {
    class Dto {
      @Min(5)
      name!: string;
    }

    const error = await catchErrors(
      givenSearchDecorator(
        {
          q: JSON.stringify({
            name: 'abc',
          }),
        },
        Dto,
      ),
    );

    expect(error.getStatus()).toEqual(422);
    expect(error.errors[0].value).toEqual('abc');
    expect(error.errors[0].property).toEqual('name');
    expect(error.errors[0].constraints).toHaveProperty('min');
  });

  it('throws with additional properties', async () => {
    class Dto {
      @IsString()
      name!: string;
    }

    const error = await catchErrors(
      givenSearchDecorator(
        {
          q: JSON.stringify({
            name: 'abc',
            age: 123,
          }),
        },
        Dto,
      ),
    );

    expect(error.getStatus()).toEqual(422);
    expect(error.errors[0].value).toEqual(123);
    expect(error.errors[0].property).toEqual('age');
    expect(error.errors[0].constraints).toHaveProperty('whitelistValidation');
  });

  it('does not validate without a dto', async () => {
    const result = await givenSearchDecorator({});
    expect(result.filter).toEqual({});
  });

  it('validates query', async () => {
    class Dto {
      @IsString()
      hello!: string;
    }

    const result = await givenSearchDecorator(
      {
        q: JSON.stringify({
          hello: 'abc',
        }),
      },
      Dto,
    );

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(result.filter.hello).toEqual('abc');
  });

  it('gets ordering', async () => {
    const result = await givenSearchDecorator({
      sort: 'a,b',
      order: 'desc',
    });

    expect(result.order.a).toEqual(QueryOrder.desc);
    expect(result.order.b).toEqual(QueryOrder.asc);
  });
});
