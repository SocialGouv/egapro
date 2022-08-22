export const enumHasValueGuard = <Enum>(
    e: Enum,
    value: unknown,
): value is Enum[keyof Enum] => Object.values(e).some(v => v === value);
