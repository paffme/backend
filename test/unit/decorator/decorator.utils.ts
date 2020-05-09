import { CustomValidationError } from '../../../src/shared/errors/custom-validation.error';

export async function catchErrors<T>(
  promise: Promise<T>,
): Promise<CustomValidationError> {
  try {
    await promise;
    throw [new Error('should have thrown')];
  } catch (err) {
    return err;
  }
}
