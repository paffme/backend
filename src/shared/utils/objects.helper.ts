export function isNil(obj: unknown): obj is undefined | null {
  return typeof obj === 'undefined' || obj === null;
}

export function isDefined<T>(obj: T | undefined | null): obj is T {
  return !isNil(obj);
}
