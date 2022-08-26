import type { Any, Objectize, SimpleObject } from "../../utils/types";
import type { ValueObject } from "./ValueObject";

export type UUID = string;
export abstract class Entity<P, Id = UUID> {
  constructor(protected readonly props: P, public readonly id?: Id) {}
}

export abstract class JsonEntity<P, Id = UUID> extends Entity<P, Id> {
  public abstract fromJson(json: EntityPropsToJson<P>): typeof this;

  public static fromJson<T extends JsonEntity<Any>>(...args: Parameters<T["fromJson"]>): T {
    return this.prototype.fromJson.call(null, ...args) as T;
  }
}

type UnboxProp<T> = T extends Any[]
  ? EntityPropsToJson<T>
  : T extends ValueObject<infer V>
  ? V
  : T extends Entity<infer TProps, Any>
  ? EntityPropsToJson<TProps>
  : T extends Date
  ? number
  : T extends SimpleObject
  ? EntityPropsToJson<T>
  : T;

export type EntityPropsToJson<T> = Objectize<{
  [P in keyof T]: UnboxProp<T[P]>;
}>;
