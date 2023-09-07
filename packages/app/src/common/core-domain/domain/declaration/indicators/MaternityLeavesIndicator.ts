import { type EntityPropsToJson } from "@common/shared-domain";
import { Percentage, PositiveInteger } from "@common/shared-domain/domain/valueObjects";

import { NotComputableReason } from "../../valueObjects/declaration/indicators/NotComputableReason";
import { AbstractIndicator, type AbstractIndicatorProps } from "./AbstractIndicator";

export interface MaternityLeavesIndicatorProps extends AbstractIndicatorProps {
  notComputableReason?: NotComputableReason;
  result?: Percentage;
  score?: PositiveInteger;
}

export class MaternityLeavesIndicator extends AbstractIndicator<MaternityLeavesIndicatorProps> {
  /** `non_calculable` - Vide ou egvi40pcet: Effectif des groupes valides inférieur à 40% de l'effectif total */
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
