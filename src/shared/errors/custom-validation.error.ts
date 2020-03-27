import { HttpException, HttpStatus, ValidationError } from '@nestjs/common';

export class CustomValidationError extends HttpException {
  public readonly errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super(
      HttpException.createBody(
        'Validation Error',
        'Validation Error',
        HttpStatus.UNPROCESSABLE_ENTITY,
      ),
      HttpStatus.UNPROCESSABLE_ENTITY,
    );

    this.errors = errors;
  }
}
