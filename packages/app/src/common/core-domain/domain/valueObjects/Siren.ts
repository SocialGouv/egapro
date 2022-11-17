import { ValidationError, ValueObject } from "@common/shared-domain";
import { isValid } from "@common/utils/luhn";

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
    if (this.siren.length !== 9) throw new ValidationError(`Le SIREN "${this.siren}" doit faire 9 caractères.`);
    if (isNaN(+this.siren)) throw new ValidationError(`Le SIREN "${this.siren}" ne dois être composé que de chiffres.`);
    if (!isValid(this.siren)) throw new ValidationError(`Le SIREN "${this.siren}" n'est pas valide.`);
  }
}
