import { ValidationError, ValueObject } from "../../../../common/shared-domain";

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
    if (!luhn(this.siren)) throw new ValidationError(`Le SIREN "${this.siren}" n'est pas valide.`);
  }
}

const luhn = (num: number | string) => {
  const arr = `${num}`
    .split("")
    .reverse()
    .map(x => parseInt(x));
  const [lastDigit, ...digits] = arr;
  let sum = digits.reduce((acc, val, i) => acc + (i % 2 ? val : (val * 2) % 9 || 9), 0);
  sum += lastDigit;
  return sum % 10 === 0;
};
