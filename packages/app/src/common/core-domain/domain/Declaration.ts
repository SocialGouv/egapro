import { AggregateRoot } from "@common/shared-domain";
import type { Email, PositiveNumber } from "@common/shared-domain/domain/valueObjects";

import type { DeclarationData } from "./DeclarationData";
import type { Siren } from "./valueObjects/Siren";

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

export class Declaration extends AggregateRoot<DeclarationProps, DeclarationPK> {
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
}
