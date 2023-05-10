import { AggregateRoot } from "@common/shared-domain";
import { type EntityMap } from "@common/shared-domain/domain/EntityMap";

import { type BalancedRepresentation } from "./declaration/indicators/BalancedRepresentation";
import { type RepresentationEquilibreeData } from "./RepresentationEquilibreeData";
import { type RepEqIndicatorsYear } from "./valueObjects/declaration/declarationInfo/RepEqIndicatorsYear";
import { type Siren } from "./valueObjects/Siren";

export interface RepresentationEquilibreeSearchResultProps {
  data: RepresentationEquilibreeData;
  results: EntityMap<RepEqIndicatorsYear, BalancedRepresentation>;
}

export type RepresentationEquilibreeSearchResultPK = [Siren, RepEqIndicatorsYear];

export class RepresentationEquilibreeSearchResult extends AggregateRoot<
  RepresentationEquilibreeSearchResultProps,
  RepresentationEquilibreeSearchResultPK
> {
  get data(): RepresentationEquilibreeData {
    return this.props.data;
  }
  get results(): EntityMap<RepEqIndicatorsYear, BalancedRepresentation> {
    return this.props.results.clone();
  }
}
