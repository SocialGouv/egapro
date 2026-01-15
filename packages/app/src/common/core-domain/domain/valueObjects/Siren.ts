import { ValidationError, ValueObject } from "@common/shared-domain";

export class Siren extends ValueObject<string> {
  constructor(private siren: string) {
    super();
    this.validate();
  }

  public getValue(): string {
    return this.siren;
  }

  public equals(v: Siren): boolean {
    return v.siren === this.siren;
  }

  public validate(): asserts this {
    if (this.siren.length !== 9 || isNaN(+this.siren))
      throw new ValidationError(`Le Siren "${this.siren}" doit faire 9 chiffres sans espace.`);
  }
}
