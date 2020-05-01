import { ValidationError } from 'class-validator';

export async function catchErrors<T>(
  promise: Promise<T>,
): Promise<ValidationError[]> {
  try {
    await promise;
    throw [new Error('should have thrown')];
  } catch (err) {
    return err;
  }
}
