import type { EventEmitter } from "stream";
import type { ZodLiteral } from "zod";

/**
 * Use it to simplify void function that can be a promise.
 */
export type pvoid = Promise<void> | void;

/**
 * Convert enum or readonly array to their mutable equivalent.
 */
export type MutableArray<T> = T extends ReadonlyArray<infer U> ? U[] : never;

/**
 * Hack for union string litteral with string to keep autocomplete.
 *
 * Can be used in mapped type that output unwanted discriminated unions.
 *
 * @example
 * ```ts
 * type Discr = "A" | "B";
 * type DiscrMap = {
 *  "A": "alpha" | "beta",
 *  "B": "beta" | "gamma"
 * }
 * type T1 = {
 *  [P in Discr]: {
 *    discr: P,
 *    prop: DiscrMap[P];
 *  }
 * }[Discr];
 * type T2 = {
 *  [P in Discr]: {
 *    discr: P,
 *    prop: UniqueString<DiscrMap[P]> | DiscrMap[P]; // first part makes unique the litterals, second ensure autocomplete
 *  }
 * }[Discr];
 *
 * const bad: T1 = {
 *  discr: "A",
 *  prop: "gamma" // typed and autocomplete with `"alpha" | "beta" | "gama"`. Bad DX but still type safe.
 * }
 * const good: T2 = {
 *   discr: "A",
 *   prop: "alpha", // typed, autocompleted, and type safed with `"alpha" | "beta"`
 * };
 * ```
 */
export type UniqueString<TStr extends string> = TStr & {
  _?: never & symbol;
};

export type UnknownMapping = UniqueString<string>;

export type FilterMethod<T> = (element: T) => boolean;
export type Nothing = never | 0 | null | undefined | void;

/**
 * Get all event "name" attached to an EventEmitter
 */
export type ListEventEmitterEvents<TEE extends EventEmitter> = TEE["on"] extends (
  event: infer T extends string,
  listener: Any,
) => void
  ? T extends string
    ? T
    : never
  : never;

/**
 * Get the listener function signature attached to an EventEmitter for a given event name.
 */
export type GetEventListener<TEE extends EventEmitter, TEvent extends ListEventEmitterEvents<TEE>> = TEE["on"] extends (
  event: infer T,
  listener: infer TListener,
) => void
  ? T extends TEvent
    ? TListener
    : never
  : never;

/**
 * Stub to trick eslint.
 * @deprecated
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Any = any;

/**
 * Force expand a type for debug purpose. Don't work on every type.
 * @deprecated
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export type __DEBUG_TYPE__<T> = { [P in keyof T]: T[P] } & {};

/**
 * Get direct subkeys of a given non array object and/or unpack a subarray type to use its keys as subkeys.
 *
 * @example
 * ```ts
 *  interface MyObject {
 *      foo: {
 *          bar: string;
 *      };
 *      baz: {
 *          qux: string
 *      }[];
 *  }
 *
 *  // DirectOrUnpackedChainedSubKeyOf<MyObject> = "foo.bar" | "baz.qux"; (and not "baz.length" | "baz.push" | ...)
 * ```
 */
export type DirectOrUnpackedChainedSubKeyOf<T> = {
  [Key in keyof T]: Key extends string
    ? T[Key] extends object
      ? T[Key] extends Array<infer R>
        ? R extends object
          ? {
              [SubArrayKey in keyof R]: SubArrayKey extends string ? `${Key}.${SubArrayKey}` : never;
            }[keyof R]
          : never
        : {
            [SubKey in keyof T[Key]]: SubKey extends string ? `${Key}.${SubKey}` : never;
          }[keyof T[Key]]
      : never
    : never;
}[keyof T];

export type KeyAndSubKeyOf<T> = DirectOrUnpackedChainedSubKeyOf<T> | keyof T;

/** @deprecated */
// eslint-disable-next-line @typescript-eslint/ban-types
export type EmptyObject = {};
export type SimpleObject<T = unknown> = Record<string, T>;
export type AnyFunction = (...args: unknown[]) => unknown;
export type EveryFunction = (...args: Any[]) => Any;
export type VoidFunction = () => void;
export type VoidArgsFunction<TArgs extends Any[] = Any[]> = (...args: TArgs) => void;

export type PartialKeys<T> = {
  [K in keyof T]-?: undefined extends T[K] ? K : never;
}[keyof T];
export type RequiredKeys<T> = Exclude<keyof T, PartialKeys<T>>;
export type Objectize<T> = { [K in keyof T]: Objectize<T[K]> };
export type InvertPartial<T> = Objectize<
  {
    [K in RequiredKeys<T>]?: T[K];
  } & { [K in PartialKeys<T>]: NonNullable<T[K]> }
>;

export type Awaitable<T> = T extends (...args: infer A) => infer R ? (...args: A) => Promise<R> : Promise<T>;

export interface FixedLengthArray<T, TLength extends number> extends Array<T> {
  "0": T;
  length: TLength;
}

export type IsTuple<T extends Any[]> = number extends T["length"] ? false : true;
export type Tuple<T, N extends number> = N extends N ? (number extends N ? T[] : _TupleOf<T, N, []>) : never;
type _TupleOf<T, N extends number, R extends unknown[]> = R["length"] extends N ? R : _TupleOf<T, N, [T, ...R]>;

export type ZodSizedTupleFromUnion<
  T,
  N extends number = UnionLength<T> extends number ? UnionLength<T> : number,
> = Tuple<ZodLiteral<T>, N>;

/** @deprecated - Dangerous as unions can be moved by linters */
export type ZodTupleFromUnion<T, TTuple = TuplifyUnion<T>> = {
  [K in keyof TTuple]: ZodLiteral<TTuple[K]>;
};

/**
 * When using abstract class, return a simulated extended class type without having to target a "real" sub class.
 */
export type ExtendedClass<T extends abstract new (...args: Any) => Any> = T extends abstract new (
  ...args: infer TArgs
) => infer TInstance
  ? new (...args: TArgs) => TInstance
  : never;
export type ImplementedClass<T> = (abstract new (...args: Any[]) => T) | (new (...args: Any[]) => T);

export type UnionToIntersection<TUnion> = (TUnion extends Any ? (k: TUnion) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;
type UnionToOverloads<TUnion> = UnionToIntersection<TUnion extends Any ? (f: TUnion) => void : never>;
export type PopUnion<TUnion> = UnionToOverloads<TUnion> extends (a: infer A) => void ? A : never;

export type PushToArray<T extends Any[], V> = [...T, V];

/** @deprecated - Dangerous as unions can be moved by linters */
export type TuplifyUnion<T, L = PopUnion<T>, N = [T] extends [never] ? true : false> = true extends N
  ? []
  : PushToArray<TuplifyUnion<Exclude<T, L>>, L>;

export type UnionLength<T> = TuplifyUnion<T>["length"];

export type UnionConcat<TUnion extends string, TSep extends string = ","> = PopUnion<TUnion> extends infer Self
  ? Self extends string
    ? Exclude<TUnion, Self> extends never
      ? Self
      : Self | UnionConcat<Exclude<TUnion, Self>, TSep> | `${UnionConcat<Exclude<TUnion, Self>, TSep>}${TSep}${Self}`
    : never
  : never;

/**
 * Split literal strings with optional split char and return a tuple of literals.
 *
 * ```ts
 * // default split char: ","
 * type LitTuple1 = Split<"a,b,c,d"> // ["a","b","c","d"]
 * // defined split char
 * type LitTuple2 = Split<"a.b.c.d", "."> // ["a","b","c","d"]
 * // missing split char
 * type LitTuple3 = Split<"a.b.c.d"> // ["a.b.c.d"]
 * ```
 */
export type Split<T extends string, TSep extends string = ","> = T extends `${infer Part}${TSep}${infer Rest}`
  ? [Part, ...Split<Rest, TSep>]
  : T extends string
  ? [T]
  : never;

export type DelegatedGuard<T> = (prop: Any) => prop is T;
export type DelegatedAsserts = (prop: Any) => asserts prop;
export type DelegatedAssertsIs<T> = (prop: Any) => asserts prop is T;

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = {
  [K in Keys]-?: Partial<Pick<T, Exclude<Keys, K>>> & Required<Pick<T, K>>;
}[Keys] &
  Pick<T, Exclude<keyof T, Keys>>;

export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = {
  [K in Keys]-?: Partial<Record<Exclude<Keys, K>, undefined>> & Required<Pick<T, K>>;
}[Keys] &
  Pick<T, Exclude<keyof T, Keys>>;

export type NonNullableProps<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

/**
 * Hacky type to remove readonly on each property
 */
export type UnReadOnly<T> = {
  -readonly [K in keyof T]: T[K];
};

// ===== Dummy type fonction and guards
export const unreadonly = <T>(value: T): UnReadOnly<T> => value;
/**
 * Returns a "non nullable" version of T object.
 *
 * All props are now considered set and not null nor undefined.
 */
export const ensureRequired = <T>(value: T) => value as Required<NonNullableProps<T>>;
