export const enumHasValueGuard = <Enum extends object>(e: Enum, value: unknown): value is Enum[keyof Enum] =>
  Object.values(e).some(v => v === value);
