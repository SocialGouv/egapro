import { type EntityPropsToJson, JsonAggregateRoot } from "@common/shared-domain";
import { type Email, PositiveNumber } from "@common/shared-domain/domain/valueObjects";

import { DeclarationData } from "./DeclarationData";
import { Siren } from "./valueObjects/Siren";

export interface DeclarationProps {
  data?: DeclarationData;
  declarant: Email;
  declaredAt: Date;
  draft?: DeclarationData;
  legacy?: DeclarationData;
  modifiedAt: Date;
  siren: Siren;
  year: PositiveNumber;
}

export type DeclarationPK = [Siren, PositiveNumber];

export class Declaration extends JsonAggregateRoot<DeclarationProps, DeclarationPK> {
  get data(): DeclarationData | undefined {
    return this.props.data;
  }

  get declarant(): Email {
    return this.props.declarant;
  }

  get declaredAt(): Date {
    return this.props.declaredAt;
  }

  get draft(): DeclarationData | undefined {
    return this.props.draft;
  }

  get legacy(): DeclarationData | undefined {
    return this.props.legacy;
  }

  get modifiedAt(): Date {
    return this.props.modifiedAt;
  }

  public setModifiedAt(modifiedAt: Date) {
    this.props.modifiedAt = new Date(modifiedAt);
  }

  get siren(): Siren {
    return this.props.siren;
  }

  get year(): PositiveNumber {
    return this.props.year;
  }

  public fromJson(json: Partial<EntityPropsToJson<DeclarationProps>>) {
    const props = {} as DeclarationProps;
    if (typeof json.declaredAt !== "undefined") {
      props.declaredAt = new Date(json.declaredAt);
    } else if (typeof this.declaredAt !== "undefined") {
      props.declaredAt = this.declaredAt;
    }

    if (typeof json.modifiedAt !== "undefined") {
      props.modifiedAt = new Date(json.modifiedAt);
    } else if (typeof this.modifiedAt !== "undefined") {
      props.modifiedAt = this.modifiedAt;
    }

    if (typeof json.siren !== "undefined") {
      props.siren = new Siren(json.siren);
    } else if (typeof this.siren !== "undefined") {
      props.siren = this.siren;
    }

    if (typeof json.year !== "undefined") {
      props.year = new PositiveNumber(json.year);
    } else if (typeof this.year !== "undefined") {
      props.year = this.year;
    }

    if (typeof json.data !== "undefined") {
      props.data = DeclarationData.fromJson(json.data);
    } else if (typeof this.data !== "undefined") {
      props.data = this.data;
    }

    return new Declaration(props) as this;
  }
}
