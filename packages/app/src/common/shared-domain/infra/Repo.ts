import type { Any } from "../../utils/types";
import type { Entity } from "../domain";

export interface SimpleRepo<T extends Entity<Any, Any> = Any> {
  getAll(): Promise<T[]>;
}

export interface SearchDefaultCriteria {
  limit?: number;
  offset?: number;
}
export interface SearchRepo<
  T extends Entity<Any, Any> = Any,
  TSearchEntity extends Entity<Any, Any> = Any,
  Criteria extends SearchDefaultCriteria = SearchDefaultCriteria,
> {
  count(criteria: Criteria): Promise<number>;
  index?(item: T): Promise<void>;
  search(criteria: Criteria): Promise<TSearchEntity[]>;
}

export interface Repo<T extends Entity<Any, Any>, ID = NonNullable<T["id"]>> extends SimpleRepo<T> {
  delete(id: ID): Promise<void>;
  exists(id: ID): Promise<boolean>;
  getOne(id: ID): Promise<T | null>;
  save(item: T): Promise<ID>;
  update(item: T): Promise<void>;
}

export interface BulkRepo<T extends Entity<Any, Any>, ID = NonNullable<T["id"]>> extends Repo<T, ID> {
  deleteBulk(...ids: ID[]): Promise<void>;
  existsMultiple(...ids: ID[]): Promise<boolean[]>;
  getMultiple(...ids: ID[]): Promise<T[]>;
  saveBulk(...items: T[]): Promise<ID[]>;
  updateBulk(...items: T[]): Promise<void>;
}

export interface CachableRepo<T extends Entity<Any, Any>, ID = NonNullable<T["id"]>> extends Repo<T, ID> {
  cache: Map<T["id"], T>;
  populate(): Promise<void>;
  populated: boolean;
}

export type SQLCount = [{ count: string }];
