import type { EntityPropsToJson } from "@common/shared-domain";
import { JsonEntity } from "@common/shared-domain";
import { PositiveInteger } from "@common/shared-domain/domain/valueObjects";

import { FavorablePopulation } from "../../valueObjects/declaration/indicators/FavorablePopulation";
import { HighRemunerationsResult } from "../../valueObjects/declaration/indicators/HighRemunerationsResult";

export interface HighRemunerationsIndicatorProps {
  favorablePopulation?: FavorablePopulation;
  progressObjective?: string;
  result?: HighRemunerationsResult;
  score?: PositiveInteger;
}

export class HighRemunerationsIndicator extends JsonEntity<HighRemunerationsIndicatorProps, never> {
  /** `population_favorable` */
  get favorablePopulation(): FavorablePopulation | undefined {
    return this.props.favorablePopulation;
  }

  /** `objectif_de_progression` */
  get progressObjective(): string | undefined {
    return this.props.progressObjective;
  }

  /** `résultat` - Nombre de 0 à 5 du sexe sous représenté parmi les 10 plus hautes rémunérations */
  get result(): HighRemunerationsResult | undefined {
    return this.props.result;
  }

  /** `note` */
  get score(): PositiveInteger | undefined {
    return this.props.score;
  }

  public fromJson(json: EntityPropsToJson<HighRemunerationsIndicatorProps>) {
    const props: HighRemunerationsIndicatorProps = {
      progressObjective: json.progressObjective,
    };

    if (typeof json.result === "number") props.result = new HighRemunerationsResult(json.result);
    if (typeof json.score === "number") props.score = new PositiveInteger(json.score);
    if (json.favorablePopulation) props.favorablePopulation = new FavorablePopulation(json.favorablePopulation);

    return new HighRemunerationsIndicator(props) as this;
  }
}
