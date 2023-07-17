import { indicatorNoteMax } from "@common/core-domain/domain/valueObjects/declaration/indicators/IndicatorThreshold";
import { type DeclarationDTO } from "@common/models/generated";
import { IndicatorNote, RecapCard } from "@design-system";
import { type PropsWithChildren } from "react";

import { funnelStaticConfig } from "../declarationFunnelConfiguration";

type IndicatorKey = Exclude<keyof NonNullable<DeclarationDTO["indicateurs"]>, "représentation_équilibrée">;

type Props = {
  customContent?: React.ReactNode;
  editable?: boolean;
  indicateurs: DeclarationDTO["indicateurs"];
  nom: IndicatorKey;
};

const matchKey: Record<IndicatorKey, keyof typeof funnelStaticConfig> = {
  rémunérations: "remunerations",
  augmentations: "augmentations",
  promotions: "promotions",
  augmentations_et_promotions: "augmentations-et-promotions",
  congés_maternité: "conges-maternite",
  hautes_rémunérations: "hautes-remunerations",
};

export const RecapCardIndicator = ({ nom, indicateurs, customContent, editable }: PropsWithChildren<Props>) => {
  const note = indicateurs?.[nom]?.note;

  editable = editable ?? false;

  return (
    <RecapCard
      title={funnelStaticConfig[matchKey[nom]].title}
      // editLink={funnelStaticConfig[matchKey[nom]].url}
      {...{ editLink: editable ? funnelStaticConfig[matchKey[nom]].url : undefined }}
      content={
        <>
          {customContent}

          {nom !== "hautes_rémunérations" && indicateurs?.[nom]?.non_calculable && (
            <p>L'indicateur n'est pas calculable.</p>
          )}

          {note !== undefined && (
            <IndicatorNote
              note={note}
              max={indicatorNoteMax[nom]}
              text="Nombre de points obtenus à l'indicateur"
              legend={
                nom === "congés_maternité"
                  ? ""
                  : indicateurs?.[nom]?.population_favorable === undefined ||
                    indicateurs?.[nom]?.population_favorable === "egalite"
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
