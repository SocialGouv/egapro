import { AggregateRoot } from "@common/shared-domain";
import { type EntityMap } from "@common/shared-domain/domain/EntityMap";

import { type DeclarationData } from "./DeclarationData";
import { type DeclarationScoreSynthesis } from "./DeclarationScoreSynthesis";
import { type DeclarationIndicatorsYear } from "./valueObjects/declaration/declarationInfo/DeclarationIndicatorsYear";
import { type Siren } from "./valueObjects/Siren";

export interface DeclarationSearchResultProps {
  data: EntityMap<DeclarationIndicatorsYear, DeclarationData>;
  name: string;
  results: EntityMap<DeclarationIndicatorsYear, DeclarationScoreSynthesis>;
  siren: Siren;
}

export type DeclarationSearchResultPK = [Siren, DeclarationIndicatorsYear];

export class DeclarationSearchResult extends AggregateRoot<DeclarationSearchResultProps, DeclarationSearchResultPK> {
  get data(): EntityMap<DeclarationIndicatorsYear, DeclarationData> {
    return this.props.data.clone();
  }

  get name(): string {
    return this.props.name;
  }

  get results(): EntityMap<DeclarationIndicatorsYear, DeclarationScoreSynthesis> {
    return this.props.results.clone();
  }

  get siren(): Siren {
    return this.props.siren;
  }
}
