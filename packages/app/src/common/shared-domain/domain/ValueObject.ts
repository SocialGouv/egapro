export abstract class ValueObject<V> {
  protected abstract validate?(): asserts this;
  public abstract equals(v: ValueObject<V>): boolean;
  public abstract getValue(): V;
}
