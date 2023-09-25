import { type EntityPropsToJson } from "@common/shared-domain";
import { Percentage } from "@common/shared-domain/domain/valueObjects";

import { NotComputableReasonMaternityLeaves } from "../../valueObjects/declaration/indicators/NotComputableReasonMaternityLeaves";
import { AbstractIndicator, type AbstractIndicatorProps } from "./AbstractIndicator";

export interface MaternityLeavesIndicatorProps extends AbstractIndicatorProps {
  notComputableReason?: NotComputableReasonMaternityLeaves;
  result?: Percentage;
}

export class MaternityLeavesIndicator extends AbstractIndicator<MaternityLeavesIndicatorProps> {
  get notComputableReason(): NotComputableReasonMaternityLeaves | undefined {
    return this.props.notComputableReason;
  }

  /** `résultat` */
  get result(): Percentage | undefined {
    return this.props.result;
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
