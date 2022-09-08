import type { EntityPropsToJson } from "@common/shared-domain";
import { JsonEntity } from "@common/shared-domain";
import { Percentage, PositiveInteger } from "@common/shared-domain/domain/valueObjects";

import { NotComputableReason } from "../../valueObjects/declaration/indicators/NotComputableReason";

export interface MaternityLeavesIndicatorProps {
  notComputableReason?: NotComputableReason;
  progressObjective?: string;
  result: Percentage;
  score: PositiveInteger;
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
  get result(): Percentage {
    return this.props.result;
  }

  /** `note` */
  get score(): PositiveInteger {
    return this.props.score;
  }

  public fromJson(json: EntityPropsToJson<MaternityLeavesIndicatorProps>) {
    const props: MaternityLeavesIndicatorProps = {
      result: new Percentage(json.result),
      score: new PositiveInteger(json.score),
      progressObjective: json.progressObjective,
    };
    if (json.notComputableReason) {
      props.notComputableReason = new NotComputableReason(json.notComputableReason);
    }

    return new MaternityLeavesIndicator(props) as this;
  }
}
