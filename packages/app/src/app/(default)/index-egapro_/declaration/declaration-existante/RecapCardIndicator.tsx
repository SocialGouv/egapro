import { indicatorNoteMax } from "@common/core-domain/domain/valueObjects/declaration/indicators/IndicatorThreshold";
import { type DeclarationDTO } from "@common/models/generated";
import { IndicatorNote, RecapCard } from "@design-system";
import { type IndicatorKey } from "@services/form/declaration/DeclarationFormBuilder";
import { type PropsWithChildren } from "react";

import { funnelStaticConfig } from "../declarationFunnelConfiguration";

type IndicatorKeyFromDTO = Exclude<keyof NonNullable<DeclarationDTO["indicateurs"]>, "représentation_équilibrée">;

type Props = {
  customContent?: React.ReactNode;
  editable?: boolean;
  indicateurs: DeclarationDTO["indicateurs"];
  nom: IndicatorKeyFromDTO;
};

const KeyInState: Record<IndicatorKeyFromDTO, IndicatorKey> = {
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
      title={funnelStaticConfig[KeyInState[nom]].title}
      // editLink={funnelStaticConfig[matchKey[nom]].url}
      {...{ editLink: editable ? funnelStaticConfig[KeyInState[nom]].url : undefined }}
      content={
        <>
          {customContent}

          {nom !== "hautes_rémunérations" && indicateurs?.[nom]?.non_calculable && (
            <p>L'indicateur n'est pas calculable.</p>
          )}

          {note !== undefined && (
            <IndicatorNote
              note={note}
              max={indicatorNoteMax[KeyInState[nom]]}
              text="Nombre de points obtenus à l'indicateur"
              legend={
                nom === "congés_maternité"
                  ? ""
                  : indicateurs?.[nom]?.population_favorable === ""
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
