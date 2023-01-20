import type { EntityPropsToJson } from "@common/shared-domain";
import { JsonEntity } from "@common/shared-domain";

import { BalancedRepresentation } from "./indicators/BalancedRepresentation";

export interface IndicatorsRepEqProps {
  balancedRepresentation?: BalancedRepresentation;
}

export class IndicatorsRepEq extends JsonEntity<IndicatorsRepEqProps, never> {
  /** `représentation_équilibrée` */
  get balancedRepresentation(): BalancedRepresentation | undefined {
    return this.props.balancedRepresentation;
  }

  public fromJson(json: EntityPropsToJson<IndicatorsRepEqProps>) {
    const props: IndicatorsRepEqProps = {};

    if (json.balancedRepresentation)
      props.balancedRepresentation = BalancedRepresentation.fromJson(json.balancedRepresentation);

    return new IndicatorsRepEq(props) as this;
  }
}
