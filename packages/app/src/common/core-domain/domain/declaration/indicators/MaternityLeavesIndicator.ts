import type { EntityPropsToJson } from "@common/shared-domain";
import { JsonEntity } from "@common/shared-domain";
import { Percentage, PositiveInteger } from "@common/shared-domain/domain/valueObjects";

import { NotComputableReason } from "../../valueObjects/declaration/indicators/NotComputableReason";

export interface MaternityLeavesIndicatorProps {
  notComputableReason?: NotComputableReason;
  progressObjective?: string;
  result?: Percentage;
  score?: PositiveInteger;
}

export class MaternityLeavesIndicator extends JsonEntity<MaternityLeavesIndicatorProps, never> {
  /** `non_calculable` - Vide ou egvi40pcet: Effectif des groupes valides inférieur à 40% de l'effectif total */
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

  public setScore(score: PositiveInteger) {
    this.props.score = score;
  }

  public fromJson(json: EntityPropsToJson<MaternityLeavesIndicatorProps>) {
    const props: MaternityLeavesIndicatorProps = {
      progressObjective: json.progressObjective,
    };
    if (json.notComputableReason) props.notComputableReason = new NotComputableReason(json.notComputableReason);
    if (typeof json.result === "number") props.result = new Percentage(json.result);
    if (typeof json.score === "number") props.score = new PositiveInteger(json.score);

    return new MaternityLeavesIndicator(props) as this;
  }
}
