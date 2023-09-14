import { type EntityPropsToJson } from "@common/shared-domain";
import { Percentage, PositiveInteger, SimpleNumber } from "@common/shared-domain/domain/valueObjects";

import { FavorablePopulation } from "../../valueObjects/declaration/indicators/FavorablePopulation";
import { NotComputableReasonPromotionsIndicator } from "../../valueObjects/declaration/indicators/NotComputableReasonPromotionsIndicator";
import { type AbstractIndicatorProps } from "./AbstractIndicator";
import { AbstractIndicator } from "./AbstractIndicator";

type Categories = [
  ouv: SimpleNumber | null,
  emp: SimpleNumber | null,
  tam: SimpleNumber | null,
  ic: SimpleNumber | null,
];

export interface PromotionsIndicatorProps extends AbstractIndicatorProps {
  categories: Categories;
  favorablePopulation?: FavorablePopulation;
  notComputableReason?: NotComputableReasonPromotionsIndicator;
  result?: Percentage;
  score?: PositiveInteger;
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
  get notComputableReason(): NotComputableReasonPromotionsIndicator | undefined {
    return this.props.notComputableReason;
  }

  /** `résultat` */
  get result(): Percentage | undefined {
    return this.props.result;
  }

  /** `note` */
  get score(): PositiveInteger | undefined {
    return this.props.score;
  }

  public fromJson(json: EntityPropsToJson<PromotionsIndicatorProps>): this {
    const categories = json.categories.map(cat => (cat ? new SimpleNumber(cat) : null));
    const props: PromotionsIndicatorProps = {
      categories,
      progressObjective: json.progressObjective,
    };

    if (json.notComputableReason)
      props.notComputableReason = new NotComputableReasonPromotionsIndicator(json.notComputableReason);
    if (json.favorablePopulation) props.favorablePopulation = new FavorablePopulation(json.favorablePopulation);
    if (typeof json.result === "number") props.result = new Percentage(json.result);
    if (typeof json.score === "number") props.score = new PositiveInteger(json.score);

    return new PromotionsIndicator(props) as this;
  }
}
