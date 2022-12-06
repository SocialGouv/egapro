import type { EntityPropsToJson } from "@common/shared-domain";
import { JsonEntity } from "@common/shared-domain";
import { Percentage, PositiveInteger } from "@common/shared-domain/domain/valueObjects";

import { FavorablePopulation } from "../../valueObjects/declaration/indicators/FavorablePopulation";
import { NotComputableReason } from "../../valueObjects/declaration/indicators/NotComputableReason";

type Categories = [Percentage | null, Percentage | null, Percentage | null, Percentage | null];

export interface SalaryRaisesOrPromotionsIndicatorProps {
  categories: Categories;
  favorablePopulation?: FavorablePopulation;
  notComputableReason?: NotComputableReason;
  progressObjective?: string;
  result?: Percentage;
  score?: PositiveInteger;
}

export class SalaryRaisesOrPromotionsIndicator extends JsonEntity<SalaryRaisesOrPromotionsIndicatorProps, never> {
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

  /** `objectif_de_progression` */
  get progressObjective(): string | undefined {
    return this.props.progressObjective;
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
    const categories = json.categories.map(cat => (cat ? new Percentage(cat) : null));
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