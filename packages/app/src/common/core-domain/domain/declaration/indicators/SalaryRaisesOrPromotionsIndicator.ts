import { type EntityPropsToJson } from "@common/shared-domain";
import { Percentage, PositiveInteger, SimpleNumber } from "@common/shared-domain/domain/valueObjects";

import { FavorablePopulation } from "../../valueObjects/declaration/indicators/FavorablePopulation";
import { NotComputableReason } from "../../valueObjects/declaration/indicators/NotComputableReason";
import { AbstractIndicator, type AbstractIndicatorProps } from "./AbstractIndicator";

type Categories = [SimpleNumber | null, SimpleNumber | null, SimpleNumber | null, SimpleNumber | null];

export interface SalaryRaisesOrPromotionsIndicatorProps extends AbstractIndicatorProps {
  categories: Categories;
  favorablePopulation?: FavorablePopulation;
  notComputableReason?: NotComputableReason;
  result?: Percentage;
  score?: PositiveInteger;
}

export class SalaryRaisesOrPromotionsIndicator extends AbstractIndicator<SalaryRaisesOrPromotionsIndicatorProps> {
  /** `catégories` */
  get categories(): Categories {
    return [...this.props.categories];
  }

  /** `population_favorable` */
  get favorablePopulation(): FavorablePopulation | undefined {
    return this.props.favorablePopulation;
  }

  /** `non_calculable` */
  get notComputableReason(): NotComputableReason | undefined {
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

  public fromJson(json: EntityPropsToJson<SalaryRaisesOrPromotionsIndicatorProps>): this {
    const categories = json.categories.map(cat => (cat ? new SimpleNumber(cat) : null));
    const props: SalaryRaisesOrPromotionsIndicatorProps = {
      categories,
      progressObjective: json.progressObjective,
    };

    if (json.notComputableReason) props.notComputableReason = new NotComputableReason(json.notComputableReason);
    if (json.favorablePopulation) props.favorablePopulation = new FavorablePopulation(json.favorablePopulation);
    if (typeof json.result === "number") props.result = new Percentage(json.result);
    if (typeof json.score === "number") props.score = new PositiveInteger(json.score);

    return new SalaryRaisesOrPromotionsIndicator(props) as this;
  }
}
