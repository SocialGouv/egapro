import { IndicateurCinqComputer } from "@common/core-domain/computers/IndicateurCinqComputer";
import { IndicateurDeuxComputer } from "@common/core-domain/computers/IndicateurDeuxComputer";
import { IndicateurDeuxTroisComputer } from "@common/core-domain/computers/IndicateurDeuxTroisComputer";
import { IndicateurQuatreComputer } from "@common/core-domain/computers/IndicateurQuatreComputer";
import { IndicateurTroisComputer } from "@common/core-domain/computers/IndicateurTroisComputer";
import { IndicateurUnComputer } from "@common/core-domain/computers/IndicateurUnComputer";
import { type Company } from "@common/core-domain/domain/declaration/Company";
import { type HighRemunerationsIndicator } from "@common/core-domain/domain/declaration/indicators/HighRemunerationsIndicator";
import { type MaternityLeavesIndicator } from "@common/core-domain/domain/declaration/indicators/MaternityLeavesIndicator";
import { type PromotionsIndicator } from "@common/core-domain/domain/declaration/indicators/PromotionsIndicator";
import { type RemunerationsIndicator } from "@common/core-domain/domain/declaration/indicators/RemunerationsIndicator";
import { type SalaryRaisesAndPromotionsIndicator } from "@common/core-domain/domain/declaration/indicators/SalaryRaisesAndPromotionsIndicator";
import { type SalaryRaisesIndicator } from "@common/core-domain/domain/declaration/indicators/SalaryRaisesIndicator";
import { type DeclarationDTO, type IndicatorKey } from "@common/core-domain/dtos/DeclarationDTO";
import assert from "assert";

import { CompanyWorkforceRange } from "../CompanyWorkforceRange";

export const indicatorNoteMax: Record<IndicatorKey, number> = {
  remunerations: IndicateurUnComputer.prototype.getMaxNote(),
  augmentations: IndicateurDeuxComputer.prototype.getMaxNote(),
  promotions: IndicateurTroisComputer.prototype.getMaxNote(),
  "augmentations-et-promotions": IndicateurDeuxTroisComputer.prototype.getMaxNote(),
  "conges-maternite": IndicateurQuatreComputer.prototype.getMaxNote(),
  "hautes-remunerations": IndicateurCinqComputer.prototype.getMaxNote(),
};

export const computeIndex = (
  formState: DeclarationDTO,
): { index: number | undefined; points: number; pointsCalculables: number } => {
  let points = 0;
  let max = 0;

  if (formState["remunerations"]?.estCalculable === "oui") {
    points += formState["remunerations-resultat"]?.note || 0;
    max += indicatorNoteMax.remunerations;
  }

  if (formState.entreprise?.tranche === "50:250") {
    if (formState["augmentations-et-promotions"]?.estCalculable === "oui") {
      points += formState["augmentations-et-promotions"].note;
      max += indicatorNoteMax["augmentations-et-promotions"];
    }
  } else {
    if (formState["augmentations"]?.estCalculable === "oui") {
      points += formState["augmentations"].note;
      max += indicatorNoteMax["augmentations"];
    }
    if (formState["promotions"]?.estCalculable === "oui") {
      points += formState["promotions"].note;
      max += indicatorNoteMax["promotions"];
    }
  }

  if (formState["conges-maternite"]?.estCalculable === "oui") {
    points += formState["conges-maternite"].note;
    max += indicatorNoteMax["conges-maternite"];
  }

  points += formState["hautes-remunerations"]?.note || 0;
  max += indicatorNoteMax["hautes-remunerations"];

  return {
    points,
    pointsCalculables: max,
    index: max >= 75 ? Math.round((points / max) * 100) : undefined, // undefined means "Non calculable".
  };
};

// TODO: use this type instead of the one in DeclarationDTO.ts
// Make adapters DTO to this type.

type ComputerDeclarationInput = {
  entreprise: Pick<Company, "range">;
  highRemunerations?: Pick<HighRemunerationsIndicator, "favorablePopulation" | "result">;
  maternityLeaves?: Pick<MaternityLeavesIndicator, "notComputableReason" | "result">;
  promotions?: Pick<PromotionsIndicator, "favorablePopulation" | "notComputableReason" | "result">;
  remunerations?: Pick<RemunerationsIndicator, "favorablePopulation" | "notComputableReason" | "result">;
  salaryRaises?: Pick<SalaryRaisesIndicator, "favorablePopulation" | "notComputableReason" | "result">;
  salaryRaisesAndPromotions?: Pick<
    SalaryRaisesAndPromotionsIndicator,
    "favorablePopulation" | "notComputableReason" | "result"
  >;
};

type ComputerDeclarationOutput = {
  [K in keyof ComputerDeclarationInput]?: {
    score: number;
  };
} & {
  computablePoints: number;
  index?: number;
  points: number;
};

export const computeIndex2 = (input: ComputerDeclarationInput): ComputerDeclarationOutput => {
  const result: Pick<ComputerDeclarationOutput, keyof ComputerDeclarationInput> = {};

  let points = 0,
    computablePoints = 0;

  if (!input.remunerations?.notComputableReason) {
    assert(input.remunerations?.result, "result must be set if notComputableReason is not set");

    result.remunerations = {
      score: IndicateurUnComputer.prototype.computeNote(input.remunerations.result.getValue()) || 0,
    };

    points += result.remunerations.score;
    computablePoints += IndicateurUnComputer.prototype.getMaxNote();
  }

  if (input.entreprise.range?.getValue() === CompanyWorkforceRange.Enum.FROM_50_TO_250) {
    if (!input.salaryRaisesAndPromotions?.notComputableReason) {
      assert(input.salaryRaisesAndPromotions?.result, "result must be set if notComputableReason is not set");

      result.salaryRaisesAndPromotions = {
        score:
          IndicateurDeuxTroisComputer.prototype.computeNote(input.salaryRaisesAndPromotions.result?.getValue()) || 0,
      };

      points += result.salaryRaisesAndPromotions?.score;
      computablePoints += IndicateurDeuxTroisComputer.prototype.getMaxNote();
    }
  } else {
    if (!input.salaryRaises?.notComputableReason) {
      assert(input.salaryRaises?.result, "result must be set if notComputableReason is not set");

      result.salaryRaises = {
        score: IndicateurDeuxComputer.prototype.computeNote(input.salaryRaises.result?.getValue()) || 0,
      };

      points += result.salaryRaises?.score;
      computablePoints += IndicateurDeuxComputer.prototype.getMaxNote();
    }
    if (!input.promotions?.notComputableReason) {
      assert(input.promotions?.result, "result must be set if notComputableReason is not set");

      result.promotions = {
        score: IndicateurTroisComputer.prototype.computeNote(input.promotions.result?.getValue()) || 0,
      };

      points += result.promotions.score;
      computablePoints += IndicateurTroisComputer.prototype.getMaxNote();
    }
  }

  if (!input.maternityLeaves?.notComputableReason) {
    assert(input.maternityLeaves?.result, "result must be set if notComputableReason is not set");

    result.maternityLeaves = {
      score: IndicateurQuatreComputer.prototype.computeNote(input.maternityLeaves.result?.getValue()) || 0,
    };

    points += result.maternityLeaves.score;
    computablePoints += IndicateurQuatreComputer.prototype.getMaxNote();
  }

  assert(input.highRemunerations?.result, "result must be set if notComputableReason is not set");

  result.highRemunerations = {
    score: IndicateurCinqComputer.prototype.computeNote(input.highRemunerations?.result.getValue()) || 0,
  };

  points += result.highRemunerations.score;
  computablePoints += IndicateurCinqComputer.prototype.getMaxNote();

  return {
    ...result,
    points,
    computablePoints,
    index: computablePoints >= 75 ? Math.round((points / computablePoints) * 100) : undefined, // undefined means "Non calculable".
  };
};
