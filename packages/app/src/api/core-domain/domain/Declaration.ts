import type { PositiveNumber } from "../../../common/shared-domain";
import { Entity } from "../../../common/shared-domain";
import type { Siren } from "./valueObjects/Siren";

export interface DeclarationProps {
  data: unknown;
  //TODO
  declarant: string;
  declaredAt: Date;
  draft: unknown;
  legacy: unknown;
  modifiedAt: Date;
  siren: Siren;
  year: PositiveNumber;
}

export type DeclarationPK = [Siren, PositiveNumber];

export class Declaration extends Entity<DeclarationProps, DeclarationPK> {
  get data() {
    return this.props.data;
  }

  get declarant() {
    return this.props.declarant;
  }

  get declaredAt() {
    return this.props.declaredAt;
  }

  get draft() {
    return this.props.draft;
  }

  get legacy() {
    return this.props.legacy;
  }

  get modifiedAt() {
    return this.props.modifiedAt;
  }

  get siren() {
    return this.props.siren;
  }

  get year() {
    return this.props.year;
  }
}
