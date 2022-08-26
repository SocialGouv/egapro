import type { EntityPropsToJson } from "../../../../../common/shared-domain";
import { JsonEntity } from "../../../../../common/shared-domain";
import { Percentage } from "../../../../../common/shared-domain/domain/valueObjects/Percentage";
import { PositiveInteger } from "../../../../../common/shared-domain/domain/valueObjects/PositiveInteger";
import { FavorablePopulation } from "../../valueObjects/declaration/indicators/FavorablePopulation";
import { NotComputableReason } from "../../valueObjects/declaration/indicators/NotComputableReason";

type Categories = [Percentage?, Percentage?, Percentage?, Percentage?];

export interface SalaryRaisesOrPromotionsIndicatorProps {
  categories: Categories;
  favorablePopulation: FavorablePopulation;
  notComputableReason?: NotComputableReason;
  progressObjective: string;
  result: Percentage;
  score: PositiveInteger;
}

export class SalaryRaisesOrPromotionsIndicator extends JsonEntity<SalaryRaisesOrPromotionsIndicatorProps, never> {
  /** `catégories` */
  get categories(): Categories {
    return [...this.props.categories];
  }

  /** `population_favorable` */
  get favorablePopulation(): FavorablePopulation {
    return this.props.favorablePopulation;
  }

  /** `non_calculable` */
  get notComputableReason(): NotComputableReason | undefined {
    return this.props.notComputableReason;
  }

  /** `objectif_de_progression` */
  get progressObjective(): string {
    return this.props.progressObjective;
  }

  /** `résultat` */
  get result(): Percentage {
    return this.props.result;
  }

  /** `note` */
  get score(): PositiveInteger {
    return this.props.score;
  }

  public fromJson(json: EntityPropsToJson<SalaryRaisesOrPromotionsIndicatorProps>): this {
    const categories = json.categories.map(cat => (cat ? new Percentage(cat) : undefined));
    const props: SalaryRaisesOrPromotionsIndicatorProps = {
      categories,
      favorablePopulation: new FavorablePopulation(json.favorablePopulation),
      progressObjective: json.progressObjective,
      result: new Percentage(json.result),
      score: new PositiveInteger(json.score),
    };
    if (json.notComputableReason) {
      props.notComputableReason = new NotComputableReason(json.notComputableReason);
    }

    return new SalaryRaisesOrPromotionsIndicator(props) as this;
  }
}
