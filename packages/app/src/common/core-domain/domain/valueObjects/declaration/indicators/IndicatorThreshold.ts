import { IndicateurCinqComputer } from "@common/core-domain/computers/IndicateurCinqComputer";
import { IndicateurDeuxComputer } from "@common/core-domain/computers/IndicateurDeuxComputer";
import { IndicateurDeuxTroisComputer } from "@common/core-domain/computers/IndicateurDeuxTroisComputer";
import { IndicateurQuatreComputer } from "@common/core-domain/computers/IndicateurQuatreComputer";
import { IndicateurTroisComputer } from "@common/core-domain/computers/IndicateurTroisComputer";
import { IndicateurUnComputer } from "@common/core-domain/computers/IndicateurUnComputer";
import { type DeclarationDTO, type IndicatorKey } from "@common/core-domain/dtos/DeclarationDTO";

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
