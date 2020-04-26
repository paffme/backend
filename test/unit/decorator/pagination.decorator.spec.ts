import { Pagination } from '../../../src/shared/decorators/pagination.decorator';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { OffsetLimitRequest } from '../../../src/shared/pagination/pagination.service';
import {
  DEFAULT_PER_PAGE,
  PAGE,
  PaginationParamsDto,
  PER_PAGE,
} from '../../../src/shared/pagination/pagination-params.dto';
import { ValidationError } from 'class-validator';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getParamDecoratorFactory(decorator: Function): Function {
  class Test {
    // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
    public test(@Pagination() value: OffsetLimitRequest): void {}
  }

  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Test, 'test');
  return args[Object.keys(args)[0]].factory;
}

function givenPaginationDecorator(
  params: Partial<PaginationParamsDto>,
): Promise<OffsetLimitRequest> {
  const factory = getParamDecoratorFactory(Pagination);

  return factory(null, {
    switchToHttp() {
      return {
        getRequest(): {} {
          return {
            params,
          };
        },
      };
    },
  });
}

async function catchErrors<T>(promise: Promise<T>): Promise<ValidationError[]> {
  try {
    await promise;
    throw [new Error('should have thrown')];
  } catch (err) {
    return err;
  }
}

describe('Pagination decorator (unit)', () => {
  it('gets default pagination values', async () => {
    const result = await givenPaginationDecorator({});
    expect(result.offset).toEqual(0);
    expect(result.limit).toEqual(DEFAULT_PER_PAGE);
  });

  it('gets pagination values', async () => {
    const result = await givenPaginationDecorator({
      [PAGE]: 5,
      [PER_PAGE]: 2,
    });

    expect(result.offset).toEqual(8);
    expect(result.limit).toEqual(2);
  });

  it('rejects when page is less than 1', async () => {
    const [error] = await catchErrors(
      givenPaginationDecorator({
        [PAGE]: ('0' as unknown) as number,
      }),
    );

    expect(error).toBeInstanceOf(ValidationError);
    expect(error.value).toEqual(0);
    expect(error.property).toEqual(PAGE);
    expect(error.constraints).toHaveProperty('min');
  });

  it('rejects when page is not a integer', async () => {
    const [error] = await catchErrors(
      givenPaginationDecorator({
        [PAGE]: ('hi' as unknown) as number,
      }),
    );

    expect(error).toBeInstanceOf(ValidationError);
    expect(error.value).toEqual(NaN);
    expect(error.property).toEqual(PAGE);
    expect(error.constraints).toHaveProperty('min');
    expect(error.constraints).toHaveProperty('isInt');
  });

  it('rejects when per page is less than 1', async () => {
    const [error] = await catchErrors(
      givenPaginationDecorator({
        [PER_PAGE]: ('0' as unknown) as number,
      }),
    );

    expect(error).toBeInstanceOf(ValidationError);
    expect(error.value).toEqual(0);
    expect(error.property).toEqual(PER_PAGE);
    expect(error.constraints).toHaveProperty('min');
  });

  it('rejects when per page is more than the default', async () => {
    const [error] = await catchErrors(
      givenPaginationDecorator({
        [PER_PAGE]: (String(DEFAULT_PER_PAGE + 1) as unknown) as number,
      }),
    );

    expect(error).toBeInstanceOf(ValidationError);
    expect(error.value).toEqual(DEFAULT_PER_PAGE + 1);
    expect(error.property).toEqual(PER_PAGE);
    expect(error.constraints).toHaveProperty('max');
  });

  it('rejects when per page is not a int', async () => {
    const [error] = await catchErrors(
      givenPaginationDecorator({
        [PER_PAGE]: ('hi' as unknown) as number,
      }),
    );

    expect(error).toBeInstanceOf(ValidationError);
    expect(error.value).toEqual(NaN);
    expect(error.property).toEqual(PER_PAGE);
    expect(error.constraints).toHaveProperty('min');
    expect(error.constraints).toHaveProperty('isInt');
  });
});
