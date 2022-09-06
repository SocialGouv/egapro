import type { EntityPropsToJson } from "@common/shared-domain";
import { JsonEntity } from "@common/shared-domain";
import { Percentage } from "@common/shared-domain/domain/valueObjects";
import { PositiveInteger } from "@common/shared-domain/domain/valueObjects/PositiveInteger";

import { FavorablePopulation } from "../../valueObjects/declaration/indicators/FavorablePopulation";
import { NotComputableReason } from "../../valueObjects/declaration/indicators/NotComputableReason";

export interface SalaryRaisesAndPromotionsIndicatorProps {
  employeesCountResult: PositiveInteger;
  employeesCountScore: PositiveInteger;
  favorablePopulation: FavorablePopulation;
  notComputableReason?: NotComputableReason;
  percentScore: Percentage;
  progressObjective: string;
  result: Percentage;
  score: PositiveInteger;
}

export class SalaryRaisesAndPromotionsIndicator extends JsonEntity<SalaryRaisesAndPromotionsIndicatorProps, never> {
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

  /** `résultat_nombre_salariés` - Résultat final en nombre équivalent de salariés */
  get employeesCountResult(): PositiveInteger {
    return this.props.employeesCountResult;
  }

  /** `note_en_pourcentage` - Nombre de points obtenus sur le résultat final en pourcentage */
  get percentScore(): Percentage {
    return this.props.percentScore;
  }

  /** `note_nombre_salariés` - Nombre de points obtenus sur le résultat final en nombre de salariés */
  get employeesCountScore(): PositiveInteger {
    return this.props.employeesCountScore;
  }

  public fromJson(json: EntityPropsToJson<SalaryRaisesAndPromotionsIndicatorProps>): this {
    const props: SalaryRaisesAndPromotionsIndicatorProps = {
      favorablePopulation: new FavorablePopulation(json.favorablePopulation),
      progressObjective: json.progressObjective,
      result: new Percentage(json.result),
      score: new PositiveInteger(json.score),
      employeesCountResult: new PositiveInteger(json.employeesCountResult),
      employeesCountScore: new PositiveInteger(json.employeesCountScore),
      percentScore: new Percentage(json.percentScore),
    };
    if (json.notComputableReason) {
      props.notComputableReason = new NotComputableReason(json.notComputableReason);
    }

    return new SalaryRaisesAndPromotionsIndicator(props) as this;
  }
}
