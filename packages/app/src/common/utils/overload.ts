import type { Any, IsTuple, Objectize } from "./types";

type Keys<T> = Objectize<Array<keyof T>>;
type Values<T> = Objectize<Array<T[keyof T]>>;

interface ObjectOverload {
  entries: <T>(o: ArrayLike<T> | T) => Values<{ [K in keyof T]: [K, T[K]] }>;
  getOwnPropertyNames: <T>(o: T) => Keys<T>;
  keys: <T>(o: T) => Keys<T>;
  values: <T>(o: T) => Values<T>;
}
const _Object = Object as ObjectOverload & Omit<ObjectConstructor, keyof ObjectOverload>;

export { _Object as Object };

declare global {
  interface String {
    toUpperCase<T extends string>(this: T): Uppercase<T>;
  }

  interface Array<T> {
    map<U, TThis extends T[]>(
      this: TThis,
      callbackfn: (value: T, index: number, array: T[]) => U,
      thisArg?: Any,
    ): IsTuple<TThis> extends true ? ChangeTuple<TThis, U> : U[];
  }
}

export type ChangeTuple<TInput extends Any[], TOutputType> = {
  [K in keyof TInput]: TOutputType;
};
