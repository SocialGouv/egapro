import { type EntityPropsToJson } from "@common/shared-domain";
import { PositiveInteger } from "@common/shared-domain/domain/valueObjects";

import { FavorablePopulation } from "../../valueObjects/declaration/indicators/FavorablePopulation";
import { HighRemunerationsResult } from "../../valueObjects/declaration/indicators/HighRemunerationsResult";
import { AbstractIndicator, type AbstractIndicatorProps } from "./AbstractIndicator";

export interface HighRemunerationsIndicatorProps extends Exclude<AbstractIndicatorProps, "score"> {
  favorablePopulation: FavorablePopulation;
  result: HighRemunerationsResult;
  score: PositiveInteger;
}

export class HighRemunerationsIndicator extends AbstractIndicator<HighRemunerationsIndicatorProps> {
  /** `population_favorable` */
  get favorablePopulation(): FavorablePopulation {
    return this.props.favorablePopulation;
  }

  /** `résultat` - Nombre de 0 à 5 du sexe sous représenté parmi les 10 plus hautes rémunérations */
  get result(): HighRemunerationsResult {
    return this.props.result;
  }

  /**
   * `note`
   * @override
   */
  get score(): PositiveInteger {
    return this.props.score;
  }

  public fromJson(json: EntityPropsToJson<HighRemunerationsIndicatorProps>) {
    const props: HighRemunerationsIndicatorProps = {
      progressObjective: json.progressObjective,
      result: new HighRemunerationsResult(json.result),
      score: new PositiveInteger(json.score),
      favorablePopulation: new FavorablePopulation(json.favorablePopulation),
    };

    return new HighRemunerationsIndicator(props) as this;
  }
}
