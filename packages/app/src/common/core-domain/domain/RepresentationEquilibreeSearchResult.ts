import { AggregateRoot } from "@common/shared-domain";
import { type EntityMap } from "@common/shared-domain/domain/EntityMap";

import { type Company } from "./declaration/Company";
import { type BalancedRepresentation } from "./declaration/indicators/BalancedRepresentation";
import { type RepEqIndicatorsYear } from "./valueObjects/declaration/declarationInfo/RepEqIndicatorsYear";
import { type Siren } from "./valueObjects/Siren";

export interface RepresentationEquilibreeSearchResultProps {
  company: Company;
  results: EntityMap<RepEqIndicatorsYear, BalancedRepresentation>;
}

export type RepresentationEquilibreeSearchResultPK = [Siren, RepEqIndicatorsYear];

export class RepresentationEquilibreeSearchResult extends AggregateRoot<
  RepresentationEquilibreeSearchResultProps,
  RepresentationEquilibreeSearchResultPK
> {
  get company(): Company {
    return this.props.company;
  }
  get results(): EntityMap<RepEqIndicatorsYear, BalancedRepresentation> {
    return this.props.results.clone();
  }
}
