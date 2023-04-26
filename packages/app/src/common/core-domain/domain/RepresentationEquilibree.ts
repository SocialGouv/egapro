import { AggregateRoot } from "@common/shared-domain";
import { type PositiveNumber } from "@common/shared-domain/domain/valueObjects";

import { type RepresentationEquilibreeData } from "./RepresentationEquilibreeData";
import { type Siren } from "./valueObjects/Siren";

export interface RepresentationEquilibreeProps {
  data?: RepresentationEquilibreeData;
  declaredAt: Date;
  modifiedAt: Date;
  siren: Siren;
  year: PositiveNumber;
}

export type RepresentationEquilibreePK = [Siren, PositiveNumber];

export class RepresentationEquilibree extends AggregateRoot<RepresentationEquilibreeProps, RepresentationEquilibreePK> {
  get data(): RepresentationEquilibreeData | undefined {
    return this.props.data;
  }

  get declaredAt(): Date {
    return this.props.declaredAt;
  }

  get modifiedAt(): Date {
    return this.props.modifiedAt;
  }

  get siren(): Siren {
    return this.props.siren;
  }

  get year(): PositiveNumber {
    return this.props.year;
  }
}
