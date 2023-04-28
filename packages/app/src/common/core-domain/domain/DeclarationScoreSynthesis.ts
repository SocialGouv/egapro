import { type EntityPropsToJson, JsonEntity } from "@common/shared-domain";
import { PositiveInteger } from "@common/shared-domain/domain/valueObjects";

import { type DeclarationInfoProps } from "./declaration/DeclarationInfo";
import { type HighRemunerationsIndicatorProps } from "./declaration/indicators/HighRemunerationsIndicator";
import { type MaternityLeavesIndicatorProps } from "./declaration/indicators/MaternityLeavesIndicator";
import { type RemunerationsIndicatorProps } from "./declaration/indicators/RemunerationsIndicator";
import { type SalaryRaisesAndPromotionsIndicatorProps } from "./declaration/indicators/SalaryRaisesAndPromotionsIndicator";
import { type SalaryRaisesOrPromotionsIndicatorProps } from "./declaration/indicators/SalaryRaisesOrPromotionsIndicator";
import { DeclarationIndex } from "./valueObjects/declaration/declarationInfo/DeclarationIndex";
import { NotComputableReason } from "./valueObjects/declaration/indicators/NotComputableReason";

export interface DeclarationScoreSynthesisProps {
  highRemunerationsScore?: HighRemunerationsIndicatorProps["score"];
  index?: DeclarationInfoProps["index"];
  maternityLeavesScore?: MaternityLeavesIndicatorProps["score"];
  notComputableReasonMaternityLeaves?: MaternityLeavesIndicatorProps["notComputableReason"];
  notComputableReasonPromotions?: SalaryRaisesOrPromotionsIndicatorProps["notComputableReason"];
  notComputableReasonRemunerations?: RemunerationsIndicatorProps["notComputableReason"];
  notComputableReasonSalaryRaises?: SalaryRaisesOrPromotionsIndicatorProps["notComputableReason"];
  notComputableReasonSalaryRaisesAndPromotions?: SalaryRaisesAndPromotionsIndicatorProps["notComputableReason"];
  promotionsScore?: SalaryRaisesOrPromotionsIndicatorProps["score"];
  remunerationsScore?: RemunerationsIndicatorProps["score"];
  salaryRaisesAndPromotionsScore?: SalaryRaisesAndPromotionsIndicatorProps["score"];
  salaryRaisesScore?: SalaryRaisesOrPromotionsIndicatorProps["score"];
}

export class DeclarationScoreSynthesis extends JsonEntity<DeclarationScoreSynthesisProps> {
  get highRemunerationsScore(): HighRemunerationsIndicatorProps["score"] | undefined {
    return this.props.highRemunerationsScore;
  }

  get index(): DeclarationInfoProps["index"] | undefined {
    return this.props.index;
  }

  get maternityLeavesScore(): MaternityLeavesIndicatorProps["score"] | undefined {
    return this.props.maternityLeavesScore;
  }

  get notComputableReasonMaternityLeaves(): MaternityLeavesIndicatorProps["notComputableReason"] {
    return this.props.notComputableReasonMaternityLeaves;
  }

  get notComputableReasonPromotions(): SalaryRaisesOrPromotionsIndicatorProps["notComputableReason"] {
    return this.props.notComputableReasonPromotions;
  }

  get notComputableReasonRemunerations(): RemunerationsIndicatorProps["notComputableReason"] {
    return this.props.notComputableReasonRemunerations;
  }

  get notComputableReasonSalaryRaises(): SalaryRaisesOrPromotionsIndicatorProps["notComputableReason"] {
    return this.props.notComputableReasonSalaryRaises;
  }

  get notComputableReasonSalaryRaisesAndPromotions(): SalaryRaisesAndPromotionsIndicatorProps["notComputableReason"] {
    return this.props.notComputableReasonSalaryRaisesAndPromotions;
  }

  get promotionsScore(): SalaryRaisesOrPromotionsIndicatorProps["score"] | undefined {
    return this.props.promotionsScore;
  }

  get remunerationsScore(): RemunerationsIndicatorProps["score"] | undefined {
    return this.props.remunerationsScore;
  }

  get salaryRaisesAndPromotionsScore(): SalaryRaisesAndPromotionsIndicatorProps["score"] | undefined {
    return this.props.salaryRaisesAndPromotionsScore;
  }

  get salaryRaisesScore(): SalaryRaisesOrPromotionsIndicatorProps["score"] | undefined {
    return this.props.salaryRaisesScore;
  }

  public fromJson(json: EntityPropsToJson<DeclarationScoreSynthesisProps>) {
    const props: DeclarationScoreSynthesisProps = {};

    if (typeof json.highRemunerationsScore === "number")
      props.highRemunerationsScore = new PositiveInteger(json.highRemunerationsScore);
    if (typeof json.index === "number") props.index = new DeclarationIndex(json.index);
    if (typeof json.maternityLeavesScore === "number")
      props.maternityLeavesScore = new PositiveInteger(json.maternityLeavesScore);
    if (json.notComputableReasonMaternityLeaves)
      props.notComputableReasonMaternityLeaves = new NotComputableReason(json.notComputableReasonMaternityLeaves);
    if (json.notComputableReasonPromotions)
      props.notComputableReasonPromotions = new NotComputableReason(json.notComputableReasonPromotions);
    if (json.notComputableReasonRemunerations)
      props.notComputableReasonRemunerations = new NotComputableReason(json.notComputableReasonRemunerations);
    if (json.notComputableReasonSalaryRaises)
      props.notComputableReasonSalaryRaises = new NotComputableReason(json.notComputableReasonSalaryRaises);
    if (json.notComputableReasonSalaryRaisesAndPromotions)
      props.notComputableReasonSalaryRaisesAndPromotions = new NotComputableReason(
        json.notComputableReasonSalaryRaisesAndPromotions,
      );
    if (typeof json.promotionsScore === "number") props.promotionsScore = new PositiveInteger(json.promotionsScore);
    if (typeof json.remunerationsScore === "number")
      props.remunerationsScore = new PositiveInteger(json.remunerationsScore);
    if (typeof json.salaryRaisesAndPromotionsScore === "number")
      props.salaryRaisesAndPromotionsScore = new PositiveInteger(json.salaryRaisesAndPromotionsScore);
    if (typeof json.salaryRaisesScore === "number")
      props.salaryRaisesScore = new PositiveInteger(json.salaryRaisesScore);

    return new DeclarationScoreSynthesis(props) as this;
  }
}
