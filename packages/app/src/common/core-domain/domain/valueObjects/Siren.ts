import { ValidationError, ValueObject } from "@common/shared-domain";
import { isValid } from "@common/utils/luhn";
import { printable } from "@common/utils/string";

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
      throw new ValidationError(`Le Siren "${printable(this.siren)}" doit faire 9 chiffres sans espace.`);
    if (!isValid(this.siren)) throw new ValidationError(`Le Siren "${printable(this.siren)}" n'est pas valide.`);
  }
}
