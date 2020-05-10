import { UnprocessableEntityException } from '@nestjs/common';
import { BaseError } from '../errors/base.error';

type CollectionWithIndex = { index: number }[];

class InvalidIndexError extends UnprocessableEntityException
  implements BaseError {
  constructor() {
    super('Invalid index');
  }

  code = 'INVALID_INDEX';
}

/**
 * Verify that the given index will be next to another index in a collection
 */
export function validateIndex(
  collection: CollectionWithIndex,
  index: number,
): void {
  if (collection.length === 0) {
    return;
  }

  const minDistance = collection.reduce((minDistance, item) => {
    const distance = Math.abs(item.index - index);
    return distance < minDistance ? distance : minDistance;
  }, Number.MAX_SAFE_INTEGER);

  if (minDistance > 1) {
    throw new InvalidIndexError();
  }
}
