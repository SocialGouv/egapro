import type { PositiveNumber } from "../../../common/shared-domain";
import { AggregateRoot } from "../../../common/shared-domain";
import type { DeclarationData } from "./DeclarationData";
import type { Siren } from "./valueObjects/Siren";

export interface DeclarationProps {
  data?: DeclarationData;
  declarant: string;
  declaredAt: Date;
  draft?: DeclarationData;
  legacy?: DeclarationData;
  modifiedAt: Date;
  siren: Siren;
  year: PositiveNumber;
}

export type DeclarationPK = [Siren, PositiveNumber];

export class Declaration extends AggregateRoot<DeclarationProps, DeclarationPK> {
  // TODO
}
