import type { UUID } from "./Entity";
import { Entity } from "./Entity";

export abstract class AggregateRoot<P, Id = UUID> extends Entity<P, Id> {}
