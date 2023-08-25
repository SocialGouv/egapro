import { indicatorNoteMax } from "@common/core-domain/domain/valueObjects/declaration/indicators/IndicatorThreshold";
import { type DeclarationDTO } from "@common/models/generated";
import { IndicatorNote, RecapCard } from "@design-system";
import { type IndicatorKey } from "@services/form/declaration/DeclarationFormBuilder";
import { capitalize } from "lodash";
import { type PropsWithChildren } from "react";

import { funnelStaticConfig } from "../declarationFunnelConfiguration";

type IndicatorKeyFromDTO = Exclude<keyof NonNullable<DeclarationDTO["indicateurs"]>, "représentation_équilibrée">;

type Props = {
  customContent?: React.ReactNode;
  edit?: boolean;
  indicateurs: DeclarationDTO["indicateurs"];
  name: IndicatorKeyFromDTO;
};

const KeyInState: Record<IndicatorKeyFromDTO, IndicatorKey> = {
  rémunérations: "remunerations",
  augmentations: "augmentations",
  promotions: "promotions",
  augmentations_et_promotions: "augmentations-et-promotions",
  congés_maternité: "conges-maternite",
  hautes_rémunérations: "hautes-remunerations",
};

export const RecapCardIndicator = ({ name, indicateurs, customContent, edit }: PropsWithChildren<Props>) => {
  const note = indicateurs?.[name]?.note;

  return (
    <RecapCard
      title={funnelStaticConfig[KeyInState[name]].title}
      editLink={(edit || void 0) && funnelStaticConfig[KeyInState[name]].url}
      content={
        <>
          {customContent}

          {name !== "hautes_rémunérations" && indicateurs?.[name]?.non_calculable && (
            <p>L'indicateur n'est pas calculable</p>
          )}

          {note !== undefined && (
            <IndicatorNote
              note={note}
              max={indicatorNoteMax[KeyInState[name]]}
              text="Nombre de points obtenus à l'indicateur"
              legend={
                name === "congés_maternité"
                  ? ""
                  : indicateurs?.[name]?.population_favorable === ""
                  ? "Égalité de l'indicateur"
                  : name === "hautes_rémunérations"
                  ? `${capitalize(indicateurs?.[name]?.population_favorable)} sur-représenté${
                      indicateurs?.[name]?.population_favorable === "femmes" ? "e" : ""
                    }s`
                  : `Écart en faveur des ${indicateurs?.[name]?.population_favorable}`
              }
            />
          )}
        </>
      }
    />
  );
};
