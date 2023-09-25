import { type EntityPropsToJson, JsonEntity } from "@common/shared-domain";
import { PositiveInteger } from "@common/shared-domain/domain/valueObjects";

import { type DeclarationInfoProps } from "./declaration/DeclarationInfo";
import { type HighRemunerationsIndicatorProps } from "./declaration/indicators/HighRemunerationsIndicator";
import { type MaternityLeavesIndicatorProps } from "./declaration/indicators/MaternityLeavesIndicator";
import { type PromotionsIndicatorProps } from "./declaration/indicators/PromotionsIndicator";
import { type RemunerationsIndicatorProps } from "./declaration/indicators/RemunerationsIndicator";
import { type SalaryRaisesAndPromotionsIndicatorProps } from "./declaration/indicators/SalaryRaisesAndPromotionsIndicator";
import { type SalaryRaisesIndicatorProps } from "./declaration/indicators/SalaryRaisesIndicator";
import { DeclarationIndex } from "./valueObjects/declaration/declarationInfo/DeclarationIndex";
import { NotComputableReasonMaternityLeaves } from "./valueObjects/declaration/indicators/NotComputableReasonMaternityLeaves";
import { NotComputableReasonPromotions } from "./valueObjects/declaration/indicators/NotComputableReasonPromotions";
import { NotComputableReasonRemunerations } from "./valueObjects/declaration/indicators/NotComputableReasonRemunerations";
import { NotComputableReasonSalaryRaises } from "./valueObjects/declaration/indicators/NotComputableReasonSalaryRaises";
import { NotComputableReasonSalaryRaisesAndPromotions } from "./valueObjects/declaration/indicators/NotComputableReasonSalaryRaisesAndPromotions";

export interface DeclarationScoreSynthesisProps {
  highRemunerationsScore?: HighRemunerationsIndicatorProps["score"];
  index?: DeclarationInfoProps["index"];
  maternityLeavesScore?: MaternityLeavesIndicatorProps["score"];
  notComputableReasonMaternityLeaves?: MaternityLeavesIndicatorProps["notComputableReason"];
  notComputableReasonPromotions?: PromotionsIndicatorProps["notComputableReason"];
  notComputableReasonRemunerations?: RemunerationsIndicatorProps["notComputableReason"];
  notComputableReasonSalaryRaises?: SalaryRaisesIndicatorProps["notComputableReason"];
  notComputableReasonSalaryRaisesAndPromotions?: SalaryRaisesAndPromotionsIndicatorProps["notComputableReason"];
  promotionsScore?: PromotionsIndicatorProps["score"];
  remunerationsScore?: RemunerationsIndicatorProps["score"];
  salaryRaisesAndPromotionsScore?: SalaryRaisesAndPromotionsIndicatorProps["score"];
  salaryRaisesScore?: SalaryRaisesIndicatorProps["score"];
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

  get notComputableReasonPromotions(): PromotionsIndicatorProps["notComputableReason"] {
    return this.props.notComputableReasonPromotions;
  }

  get notComputableReasonRemunerations(): RemunerationsIndicatorProps["notComputableReason"] {
    return this.props.notComputableReasonRemunerations;
  }

  get notComputableReasonSalaryRaises(): SalaryRaisesIndicatorProps["notComputableReason"] {
    return this.props.notComputableReasonSalaryRaises;
  }

  get notComputableReasonSalaryRaisesAndPromotions(): SalaryRaisesAndPromotionsIndicatorProps["notComputableReason"] {
    return this.props.notComputableReasonSalaryRaisesAndPromotions;
  }

  get promotionsScore(): PromotionsIndicatorProps["score"] | undefined {
    return this.props.promotionsScore;
  }

  get remunerationsScore(): RemunerationsIndicatorProps["score"] | undefined {
    return this.props.remunerationsScore;
  }

  get salaryRaisesAndPromotionsScore(): SalaryRaisesAndPromotionsIndicatorProps["score"] | undefined {
    return this.props.salaryRaisesAndPromotionsScore;
  }

  get salaryRaisesScore(): SalaryRaisesIndicatorProps["score"] | undefined {
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
      props.notComputableReasonMaternityLeaves = new NotComputableReasonMaternityLeaves(
        json.notComputableReasonMaternityLeaves,
      );
    if (json.notComputableReasonPromotions)
      props.notComputableReasonPromotions = new NotComputableReasonPromotions(json.notComputableReasonPromotions);
    if (json.notComputableReasonRemunerations)
      props.notComputableReasonRemunerations = new NotComputableReasonRemunerations(
        json.notComputableReasonRemunerations,
      );
    if (json.notComputableReasonSalaryRaises)
      props.notComputableReasonSalaryRaises = new NotComputableReasonSalaryRaises(json.notComputableReasonSalaryRaises);
    if (json.notComputableReasonSalaryRaisesAndPromotions)
      props.notComputableReasonSalaryRaisesAndPromotions = new NotComputableReasonSalaryRaisesAndPromotions(
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
