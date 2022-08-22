import { enumHasValueGuard } from '../../../utils/enum';
import { Any } from '../../../utils/types';
import { ValidationError } from "../ValidationError";
import { ValueObject } from "../ValueObject";

export abstract class Enum<TEnum extends object> extends ValueObject<
    TEnum[keyof TEnum]
> {
    constructor(
        private value: TEnum[keyof TEnum],
        protected enumObject: TEnum,
    ) {
        super();
        this.validate();
    }

    public getValue() {
        return this.value;
    }

    public equals<T extends TEnum>(v: Enum<T>) {
        return (v.value as Any) === this.value;
    }

    public validate(): asserts this {
        if (!enumHasValueGuard(this.enumObject, this.value)) {
            throw new ValidationError(
                `"${
                    this.value
                }" is not a valid ${this.constructor.name.toLowerCase()}.`,
            );
        }
    }
}
