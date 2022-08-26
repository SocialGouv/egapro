import type { EntityPropsToJson } from "../../../../../common/shared-domain";
import { JsonEntity } from "../../../../../common/shared-domain";
import { PositiveInteger } from "../../../../../common/shared-domain/domain/valueObjects/PositiveInteger";
import { FavorablePopulation } from "../../valueObjects/declaration/indicators/FavorablePopulation";
import { HighRemunerationsResult } from "../../valueObjects/declaration/indicators/HighRemunerationsResult";

export interface HighRemunerationsIndicatorProps {
  favorablePopulation: FavorablePopulation;
  progressObjective: string;
  result: HighRemunerationsResult;
  score: PositiveInteger;
}

export class HighRemunerationsIndicator extends JsonEntity<HighRemunerationsIndicatorProps, never> {
  /** `population_favorable` */
  get favorablePopulation(): FavorablePopulation {
    return this.props.favorablePopulation;
  }

  /** `objectif_de_progression` */
  get progressObjective(): string {
    return this.props.progressObjective;
  }

  /** `résultat` - Nombre de 0 à 5 du sexe sous représenté parmi les 10 plus hautes rémunérations */
  get result(): HighRemunerationsResult {
    return this.props.result;
  }

  /** `note` */
  get score(): PositiveInteger {
    return this.props.score;
  }

  public fromJson(json: EntityPropsToJson<HighRemunerationsIndicatorProps>) {
    return new HighRemunerationsIndicator({
      result: new HighRemunerationsResult(json.result),
      score: new PositiveInteger(json.score),
      favorablePopulation: new FavorablePopulation(json.favorablePopulation),
      progressObjective: json.progressObjective,
    }) as this;
  }
}
