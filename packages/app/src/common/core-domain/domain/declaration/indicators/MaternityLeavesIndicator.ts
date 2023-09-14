import { type EntityPropsToJson } from "@common/shared-domain";
import { Percentage, type PositiveInteger } from "@common/shared-domain/domain/valueObjects";

import { NotComputableReasonMaternityLeaves } from "../../valueObjects/declaration/indicators/NotComputableReasonMaternityLeaves";
import { type AbstractIndicatorProps } from "./AbstractIndicator";
import { AbstractIndicator } from "./AbstractIndicator";

export interface MaternityLeavesIndicatorProps extends AbstractIndicatorProps {
  notComputableReason?: NotComputableReasonMaternityLeaves;
  result?: Percentage;
  score?: PositiveInteger;
}

export class MaternityLeavesIndicator extends AbstractIndicator<MaternityLeavesIndicatorProps> {
  get notComputableReason(): NotComputableReasonMaternityLeaves | undefined {
    return this.props.notComputableReason;
  }

  /** `résultat` */
  get result(): Percentage | undefined {
    return this.props["notComputableReason"] ? undefined : this.props.result;
  }

  /** `note` */
  get score(): PositiveInteger | undefined {
    return this.props["notComputableReason"] ? undefined : this.props.score;
  }

  public fromJson(json: EntityPropsToJson<MaternityLeavesIndicatorProps>) {
    const props: MaternityLeavesIndicatorProps = {
      progressObjective: json.progressObjective,
      notComputableReason: json.notComputableReason
        ? new NotComputableReasonMaternityLeaves(json.notComputableReason)
        : undefined,
      ...(typeof json.result === "number" && { result: new Percentage(json.result) }),
      ...(typeof json.score === "number" && { score: new Percentage(json.score) }),
    };

    return new MaternityLeavesIndicator(props) as this;
  }
}
