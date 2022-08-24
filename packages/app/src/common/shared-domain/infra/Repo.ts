import type { Any } from "@instamed/utils";
import type { Entity } from "../domain";

export interface SimpleRepo {
  getAll(): Promise<Any[]>;
}

export interface Repo<T extends Entity<Any, Any>, ID = NonNullable<T["id"]>> extends SimpleRepo {
  delete(item: T): Promise<void>;
  exists(id: ID): Promise<boolean>;
  getAll(): Promise<T[]>;
  getOne(id: ID): Promise<T | null>;
  save(item: T): Promise<void>;
  update(item: T): Promise<void>;
}

export interface BulkRepo<T extends Entity<Any, Any>, ID = NonNullable<T["id"]>> extends Repo<T, ID> {
  deleteBulk(...items: T[]): Promise<void>;
  existsMultiple(...ids: ID[]): Promise<boolean[]>;
  getMultiple(...ids: ID[]): Promise<T[]>;
  saveBulk(...items: T[]): Promise<void>;
  updateBulk(...items: T[]): Promise<void>;
}

export interface CachableRepo<T extends Entity<Any, Any>, ID = NonNullable<T["id"]>> extends Repo<T, ID> {
  cache: Map<T["id"], T>;
  populate(): Promise<void>;
  populated: boolean;
}
