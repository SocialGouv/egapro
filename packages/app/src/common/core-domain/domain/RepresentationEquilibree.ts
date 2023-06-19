import { type EntityPropsToJson, JsonAggregateRoot } from "@common/shared-domain";
import { PositiveNumber } from "@common/shared-domain/domain/valueObjects";

import { Company } from "./declaration/Company";
import { BalancedRepresentation } from "./declaration/indicators/BalancedRepresentation";
import { Declarant } from "./representationEquilibree/Declarant";
import { Publication } from "./representationEquilibree/Publication";
import { DeclarationSource } from "./valueObjects/declaration/DeclarationSource";
import { Siren } from "./valueObjects/Siren";

export interface RepresentationEquilibreeProps {
  company: Company;
  declarant: Declarant;
  declaredAt: Date;
  endReferencePeriod: Date;
  indicator: BalancedRepresentation;
  modifiedAt: Date;
  publication?: Publication;
  siren: Siren;
  source?: DeclarationSource;
  year: PositiveNumber;
}

export type RepresentationEquilibreePK = [Siren, PositiveNumber];

export class RepresentationEquilibree extends JsonAggregateRoot<
  RepresentationEquilibreeProps,
  RepresentationEquilibreePK
> {
  get company(): Company {
    return this.props.company;
  }

  get declarant(): Declarant {
    return this.props.declarant;
  }

  get declaredAt(): Date {
    return this.props.declaredAt;
  }

  get endReferencePeriod(): Date {
    return this.props.endReferencePeriod;
  }

  get indicator(): BalancedRepresentation {
    return this.props.indicator;
  }

  get modifiedAt(): Date {
    return this.props.modifiedAt;
  }

  get publication(): Publication | undefined {
    return this.props.publication;
  }

  get siren(): Siren {
    return this.props.siren;
  }

  get source(): DeclarationSource | undefined {
    return this.props.source;
  }

  get year(): PositiveNumber {
    return this.props.year;
  }

  public fromJson(json: Partial<EntityPropsToJson<RepresentationEquilibreeProps>>) {
    const props = {} as RepresentationEquilibreeProps;
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

    if (typeof json.company !== "undefined") {
      props.company = Company.fromJson(json.company);
    } else if (typeof this.company !== "undefined") {
      props.company = this.company;
    }

    if (typeof json.declarant !== "undefined") {
      props.declarant = Declarant.fromJson(json.declarant);
    } else if (typeof this.declarant !== "undefined") {
      props.declarant = this.declarant;
    }

    if (typeof json.indicator !== "undefined") {
      props.indicator = BalancedRepresentation.fromJson(json.indicator);
    } else if (typeof this.indicator !== "undefined") {
      props.indicator = this.indicator;
    }

    if (typeof json.endReferencePeriod !== "undefined") {
      props.endReferencePeriod = new Date(json.endReferencePeriod);
    } else if (typeof this.endReferencePeriod !== "undefined") {
      props.endReferencePeriod = this.endReferencePeriod;
    }

    if (typeof json.publication !== "undefined") {
      props.publication = Publication.fromJson(json.publication);
    } else if (typeof this.publication !== "undefined") {
      props.publication = this.publication;
    }

    if (typeof json.source !== "undefined") {
      props.source = new DeclarationSource(json.source);
    } else if (typeof this.source !== "undefined") {
      props.source = this.source;
    }

    return new RepresentationEquilibree(props) as this;
  }
}
