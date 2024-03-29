import { Entity, JsonEntity, type UUID } from "./Entity";

export abstract class AggregateRoot<P, Id = UUID> extends Entity<P, Id> {}

export abstract class JsonAggregateRoot<P, Id = UUID> extends JsonEntity<P, Id> {}
