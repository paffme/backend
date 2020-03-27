import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

const types = [String, Boolean, Number, Array, Object];

@Injectable()
export class ValidationPipe implements PipeTransform<unknown> {
  async transform(value: any, metadata: ArgumentMetadata): Promise<void> {
    const { metatype } = metadata;

    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      throw new BadRequestException('Validation failed');
    }

    return value;
  }

  private toValidate(metatype): boolean {
    return !types.find((type) => metatype === type);
  }
}
