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

  public fromJson(json: EntityPropsToJson<RepresentationEquilibreeProps>) {
    const props: RepresentationEquilibreeProps = {
      declaredAt: new Date(json.declaredAt),
      modifiedAt: new Date(json.modifiedAt),
      siren: new Siren(json.siren),
      year: new PositiveNumber(json.year),
      company: Company.fromJson(json.company),
      declarant: Declarant.fromJson(json.declarant),
      indicator: BalancedRepresentation.fromJson(json.indicator),
      endReferencePeriod: new Date(json.endReferencePeriod),
    };

    if (json.publication) {
      props.publication = Publication.fromJson(json.publication);
    }

    if (json.source) {
      props.source = new DeclarationSource(json.source);
    }

    return new RepresentationEquilibree(props) as this;
  }
}
