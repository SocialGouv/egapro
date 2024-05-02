import { type EntityPropsToJson } from "@common/shared-domain";
import {
  type Percentage,
  PositiveInteger,
  PositiveNumber,
  SimpleNumber,
} from "@common/shared-domain/domain/valueObjects";

import { FavorablePopulation } from "../../valueObjects/declaration/indicators/FavorablePopulation";
import { NotComputableReasonPromotions } from "../../valueObjects/declaration/indicators/NotComputableReasonPromotions";
import { AbstractIndicator, type AbstractIndicatorProps } from "./AbstractIndicator";

type Categories = [
  ouv: SimpleNumber | null,
  emp: SimpleNumber | null,
  tam: SimpleNumber | null,
  ic: SimpleNumber | null,
];

export interface PromotionsIndicatorProps extends AbstractIndicatorProps {
  categories: Categories;
  favorablePopulation?: FavorablePopulation;
  notComputableReason?: NotComputableReasonPromotions;
  result?: Percentage;
}

export class PromotionsIndicator extends AbstractIndicator<PromotionsIndicatorProps> {
  /** `catégories` */
  get categories(): Categories {
    return [...this.props.categories];
  }

  /** `population_favorable` */
  get favorablePopulation(): FavorablePopulation | undefined {
    return this.props.favorablePopulation;
  }

  /** `non_calculable` */
  get notComputableReason(): NotComputableReasonPromotions | undefined {
    return this.props.notComputableReason;
  }

  /** `résultat` */
  get result(): Percentage | undefined {
    return this.props.result;
  }

  public fromJson(json: EntityPropsToJson<PromotionsIndicatorProps>): this {
    const categories = json.categories.map(cat => (typeof cat === "number" ? new SimpleNumber(cat) : null));
    const props: PromotionsIndicatorProps = {
      categories,
    };

    if (json.notComputableReason)
      props.notComputableReason = new NotComputableReasonPromotions(json.notComputableReason);
    if (json.favorablePopulation) props.favorablePopulation = new FavorablePopulation(json.favorablePopulation);
    if (typeof json.result === "number") props.result = new PositiveNumber(json.result);
    if (typeof json.score === "number") props.score = new PositiveInteger(json.score);

    return new PromotionsIndicator(props) as this;
  }
}
