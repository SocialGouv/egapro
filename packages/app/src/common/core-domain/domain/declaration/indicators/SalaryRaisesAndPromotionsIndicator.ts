import type { EntityPropsToJson } from "@common/shared-domain";
import { JsonEntity } from "@common/shared-domain";
import { Percentage } from "@common/shared-domain/domain/valueObjects";
import { PositiveInteger } from "@common/shared-domain/domain/valueObjects/PositiveInteger";

import { FavorablePopulation } from "../../valueObjects/declaration/indicators/FavorablePopulation";
import { NotComputableReason } from "../../valueObjects/declaration/indicators/NotComputableReason";

export interface SalaryRaisesAndPromotionsIndicatorProps {
  employeesCountResult?: PositiveInteger;
  employeesCountScore?: PositiveInteger;
  favorablePopulation?: FavorablePopulation;
  notComputableReason?: NotComputableReason;
  percentScore?: Percentage;
  progressObjective?: string;
  result?: Percentage;
  score?: PositiveInteger;
}

export class SalaryRaisesAndPromotionsIndicator extends JsonEntity<SalaryRaisesAndPromotionsIndicatorProps, never> {
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

  /** `résultat_nombre_salariés` - Résultat final en nombre équivalent de salariés */
  get employeesCountResult(): PositiveInteger | undefined {
    return this.props.employeesCountResult;
  }

  /** `note_en_pourcentage` - Nombre de points obtenus sur le résultat final en pourcentage */
  get percentScore(): Percentage | undefined {
    return this.props.percentScore;
  }

  /** `note_nombre_salariés` - Nombre de points obtenus sur le résultat final en nombre de salariés */
  get employeesCountScore(): PositiveInteger | undefined {
    return this.props.employeesCountScore;
  }

  public fromJson(json: EntityPropsToJson<SalaryRaisesAndPromotionsIndicatorProps>): this {
    const props: SalaryRaisesAndPromotionsIndicatorProps = {
      progressObjective: json.progressObjective,
    };
    if (json.notComputableReason) props.notComputableReason = new NotComputableReason(json.notComputableReason);
    if (json.favorablePopulation) props.favorablePopulation = new FavorablePopulation(json.favorablePopulation);
    if (typeof json.result === "number") props.result = new Percentage(json.result);
    if (typeof json.score === "number") props.score = new PositiveInteger(json.score);
    if (typeof json.employeesCountResult === "number")
      props.employeesCountResult = new PositiveInteger(json.employeesCountResult);
    if (typeof json.employeesCountScore === "number")
      props.employeesCountScore = new PositiveInteger(json.employeesCountScore);
    if (typeof json.percentScore === "number") props.percentScore = new Percentage(json.percentScore);

    return new SalaryRaisesAndPromotionsIndicator(props) as this;
  }
}