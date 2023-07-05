import { indicatorNoteMax } from "@common/core-domain/domain/valueObjects/declaration/indicators/IndicatorThreshold";
import { type DeclarationDTO } from "@common/models/generated";
import { IndicatorNote, RecapCard } from "@design-system";
import { type PropsWithChildren } from "react";

import { funnelStaticConfig } from "../declarationFunnelConfiguration";

type IndicatorKey = Exclude<keyof NonNullable<DeclarationDTO["indicateurs"]>, "représentation_équilibrée">;

type Props = {
  customContent?: React.ReactNode;
  indicateurs: DeclarationDTO["indicateurs"];
  nom: IndicatorKey;
};

const title: Record<IndicatorKey, string> = {
  rémunérations: funnelStaticConfig["remunerations"].title,
  augmentations: funnelStaticConfig["augmentations"].title,
  promotions: funnelStaticConfig["promotions"].title,
  augmentations_et_promotions: funnelStaticConfig["augmentations-et-promotions"].title,
  congés_maternité: funnelStaticConfig["conges-maternite"].title,
  hautes_rémunérations: funnelStaticConfig["hautes-remunerations"].title,
};

export const RecapCardIndicator = ({ nom, indicateurs, customContent }: PropsWithChildren<Props>) => {
  const note = indicateurs?.[nom]?.note;

  return (
    <RecapCard
      title={title[nom]}
      content={
        <>
          {customContent}

          {nom !== "hautes_rémunérations" && indicateurs?.[nom]?.non_calculable && (
            <p>L'indicateur n'est pas calculable.</p>
          )}

          {note && (
            <IndicatorNote
              note={note}
              max={indicatorNoteMax[nom]}
              text="Nombre de points obtenus à l'indicateur"
              legend={
                nom === "congés_maternité"
                  ? ""
                  : indicateurs?.[nom]?.population_favorable === "egalite"
                  ? "Égalité de l'indicateur"
                  : `Écart en faveur des ${indicateurs?.[nom]?.population_favorable}`
              }
            />
          )}
        </>
      }
    />
  );
};
