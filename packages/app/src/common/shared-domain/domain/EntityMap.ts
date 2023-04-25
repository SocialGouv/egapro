import { type Any } from "@common/utils/types";

import { type Entity } from "./Entity";
import { type ValueObject } from "./ValueObject";

/**
 * Override standard map to use in domain only with ValueObject as key.
 */
export class EntityMap<
  K extends ValueObject<Any>,
  V extends Entity<Any, Any> | ValueObject<Any>,
  KRaw extends K extends ValueObject<infer R> ? R : never = K extends ValueObject<infer R> ? R : never,
> extends Map<K, V> {
  private _keys = new Map<KRaw, K>();

  public [Symbol.iterator]() {
    return this.entries();
  }

  constructor(entries?: Iterable<readonly [K, V]>) {
    super();
    if (entries) {
      for (const [key, value] of entries) {
        this.set(key, value);
      }
    }
  }

  public clone(): EntityMap<K, V, KRaw> {
    return new EntityMap(this);
  }

  public set(key: K, value: V) {
    const rawKey = key.getValue();
    this._keys.set(rawKey, key);
    return super.set(rawKey, value);
  }

  public get(key: K) {
    return super.get(key.getValue());
  }

  public delete(key: K) {
    const rawKey = key.getValue();
    this._keys.delete(rawKey);
    return super.delete(rawKey);
  }

  public has(key: K) {
    const rawKey = key.getValue();
    return this._keys.has(rawKey) && super.has(rawKey);
  }

  public keys() {
    return this._keys.values();
  }

  public rawKeys() {
    return this._keys.keys();
  }

  public entries(): IterableIterator<[K, V]> {
    const rawEntries = this.rawEntries();
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- needed in iterator
    const that = this;
    return {
      [Symbol.iterator]() {
        return this;
      },
      next() {
        const entry = rawEntries.next();
        if (entry.done) {
          return { value: undefined, done: true };
        }
        const [rawKey, value] = entry.value;
        const complexKey = that._keys.get(rawKey);
        if (!complexKey) {
          throw new Error("Unexpected missing complex key");
        }
        return { value: [complexKey, value], done: false };
      },
      return(value) {
        if (typeof rawEntries.return === "function") {
          rawEntries.return(value);
        }
        return { value, done: true };
      },
      throw(error) {
        if (typeof rawEntries.throw === "function") {
          rawEntries.throw(error);
        }
        throw error;
      },
    };
  }

  public rawEntries(): IterableIterator<[KRaw, V]> {
    return super.entries() as unknown as IterableIterator<[KRaw, V]>;
  }

  public forEach(callbackfn: (value: V, key: K, map: EntityMap<K, V>) => void) {
    super.forEach((value, key) => {
      const complexKey = this._keys.get(key as unknown as KRaw);

      if (!complexKey) {
        throw new Error("Unexpected missing complex key");
      }
      callbackfn(value, complexKey, this);
    });
  }
}
