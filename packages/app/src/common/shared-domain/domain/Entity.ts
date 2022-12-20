import type { Any, Objectize, SimpleObject } from "../../utils/types";
import type { ValueObject } from "./ValueObject";
import type { Enum } from "./valueObjects";

export type UUID = string;
export abstract class Entity<P, out Id = UUID> {
  constructor(protected readonly props: P, public readonly id?: Id) {}
}

export abstract class JsonEntity<P, out Id = UUID> extends Entity<P, Id> {
  public abstract fromJson(json: EntityPropsToJson<P>): typeof this;

  public static fromJson<T extends JsonEntity<Any>>(...args: Parameters<T["fromJson"]>): T {
    return this.prototype.fromJson.call(null, ...args) as T;
  }
}

type UnboxProp<T> = T extends Any[]
  ? EntityPropsToJson<T>
  : T extends Enum<infer E>
  ? Enum.ToString<E>
  : T extends ValueObject<infer V>
  ? V
  : T extends Entity<infer TProps, Any>
  ? EntityPropsToJson<TProps>
  : T extends Date
  ? string
  : T extends SimpleObject
  ? EntityPropsToJson<T>
  : T;

export type EntityPropsToJson<T> = Objectize<{
  [P in keyof T]: UnboxProp<T[P]>;
}>;
