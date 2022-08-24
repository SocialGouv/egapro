import { ValidationError } from "../ValidationError";
import { ValueObject } from "../ValueObject";
import { Url } from "./Url";

interface ImageProps {
  height: number;
  url: string;
  width: number;
}

export class Image extends ValueObject<ImageProps> {
  constructor(private value: ImageProps) {
    super();
    this.validate();
  }

  public validate(): asserts this {
    new Url(this.value.url);
    if (this.value.width < 0) {
      throw new ValidationError(`Image width should be postive. Found: ${this.value.width}`);
    }
    if (this.value.height < 0) {
      throw new ValidationError(`Image height should be postive. Found: ${this.value.height}`);
    }
  }

  public equals(v: Image) {
    return (Object.keys(this.value) as Array<keyof ImageProps>).every(
      propName => this.value[propName] === v.value[propName],
    );
  }

  public getValue(): ImageProps {
    return { ...this.value };
  }
}
