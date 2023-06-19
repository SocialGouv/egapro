import { type Any } from "../../utils/types";
import { type Entity } from "./Entity";
import { type ValidationError } from "./ValidationError";

type DefaultEntity = Entity<Any, Any>;
export interface Specification<T extends DefaultEntity> {
  and(spec: Specification<T>): Specification<T>;
  isSatisfiedBy(entity: T): boolean;
  lastError?: ValidationError;
  not(): Specification<T>;
  or(spec: Specification<T>): Specification<T>;
}

export abstract class AbstractSpecification<T extends DefaultEntity> implements Specification<T> {
  public abstract isSatisfiedBy(candidate: T): boolean;

  public and(other: Specification<T>): Specification<T> {
    return new AndSpecification(this, other);
  }
  public or(other: Specification<T>): Specification<T> {
    return new OrSpecification(this, other);
  }
  public not(): Specification<T> {
    return new NotSpecification(this);
  }
}

export class AndSpecification<T extends DefaultEntity> extends AbstractSpecification<T> {
  constructor(private one: Specification<T>, private other: Specification<T>) {
    super();
  }

  public isSatisfiedBy(entity: T): boolean {
    return this.one.isSatisfiedBy(entity) && this.other.isSatisfiedBy(entity);
  }

  get lastError() {
    return this.one.lastError ?? this.other.lastError;
  }
}

export class OrSpecification<T extends DefaultEntity> extends AbstractSpecification<T> {
  constructor(private one: Specification<T>, private other: Specification<T>) {
    super();
  }

  public isSatisfiedBy(entity: T): boolean {
    return this.one.isSatisfiedBy(entity) || this.other.isSatisfiedBy(entity);
  }

  get lastError() {
    return this.one.lastError ?? this.other.lastError;
  }
}

export class NotSpecification<T extends DefaultEntity> extends AbstractSpecification<T> {
  constructor(private wrapped: Specification<T>) {
    super();
  }

  public isSatisfiedBy(entity: T): boolean {
    return !this.wrapped.isSatisfiedBy(entity);
  }

  get lastError() {
    return this.wrapped.lastError;
  }
}
