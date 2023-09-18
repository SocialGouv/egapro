import { type EntityPropsToJson } from "@common/shared-domain";
import { Percentage, PositiveInteger, SimpleNumber } from "@common/shared-domain/domain/valueObjects";

import { FavorablePopulation } from "../../valueObjects/declaration/indicators/FavorablePopulation";
import { NotComputableReasonSalaryRaises } from "../../valueObjects/declaration/indicators/NotComputableReasonSalaryRaises";
import { type AbstractIndicatorProps } from "./AbstractIndicator";
import { AbstractIndicator } from "./AbstractIndicator";

type Categories = [
  ouv: SimpleNumber | null,
  emp: SimpleNumber | null,
  tam: SimpleNumber | null,
  ic: SimpleNumber | null,
];

// Augmentations
export interface SalaryRaisesIndicatorProps extends AbstractIndicatorProps {
  categories: Categories;
  favorablePopulation?: FavorablePopulation;
  notComputableReason?: NotComputableReasonSalaryRaises;
  result?: Percentage;
  score?: PositiveInteger;
}

export class SalaryRaisesIndicator extends AbstractIndicator<SalaryRaisesIndicatorProps> {
  /** `catégories` */
  get categories(): Categories {
    return [...this.props.categories];
  }

  /** `population_favorable` */
  get favorablePopulation(): FavorablePopulation | undefined {
    return this.props.favorablePopulation;
  }

  /** `non_calculable` */
  get notComputableReason(): NotComputableReasonSalaryRaises | undefined {
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

  public fromJson(json: EntityPropsToJson<SalaryRaisesIndicatorProps>): this {
    const categories = json.categories.map(cat => (cat ? new SimpleNumber(cat) : null));
    const props: SalaryRaisesIndicatorProps = {
      categories,
      progressObjective: json.progressObjective,
    };

    if (json.notComputableReason)
      props.notComputableReason = new NotComputableReasonSalaryRaises(json.notComputableReason);
    if (json.favorablePopulation) props.favorablePopulation = new FavorablePopulation(json.favorablePopulation);
    if (typeof json.result === "number") props.result = new Percentage(json.result);
    if (typeof json.score === "number") props.score = new PositiveInteger(json.score);

    return new SalaryRaisesIndicator(props) as this;
  }
}
