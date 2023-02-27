import { ValidationError, ValueObject } from "@common/shared-domain";
import { isValid } from "@common/utils/luhn";

export class Siret extends ValueObject<string> {
  constructor(private siret: string) {
    super();
    this.validate();
  }

  public getValue(): string {
    return this.siret;
  }

  public equals(v: Siret): boolean {
    return v.siret === this.siret;
  }

  public validate(): asserts this {
    if (this.siret.length !== 14) throw new ValidationError(`Le Siret "${this.siret}" doit faire 9 caractères.`);
    if (isNaN(+this.siret)) throw new ValidationError(`Le Siret "${this.siret}" ne doit être composé que de chiffres.`);
    if (!isValid(this.siret)) throw new ValidationError(`Le Siret "${this.siret}" n'est pas valide.`);
  }
}
