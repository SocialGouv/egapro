"use client";

import { indicatorNoteMax } from "@common/core-domain/computers/DeclarationComputer";
import { FavorablePopulation } from "@common/core-domain/domain/valueObjects/declaration/indicators/FavorablePopulation";
import { NotComputableReason } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReason";
import { type IndicatorKey } from "@common/core-domain/dtos/DeclarationDTO";
import { IndicatorNote, RecapCard } from "@design-system";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { capitalize, lowerFirst } from "lodash";
import { type PropsWithChildren } from "react";

import { funnelStaticConfig } from "../../declarationFunnelConfiguration";

type Props = {
  customContent?: React.ReactNode;
  edit?: boolean;
  name: IndicatorKey;
};

type GenericFieldIndicator = Partial<{
  estCalculable: "non" | "oui";
  motifNonCalculabilité: string;
  note: number;
  populationFavorable: FavorablePopulation.Enum;
  résultat: number;
}>;

export const RecapCardIndicator = ({ name, customContent, edit }: PropsWithChildren<Props>) => {
  const { formData } = useDeclarationFormManager();

  const indicateur = formData[name] as unknown as GenericFieldIndicator;

  const note = name === "remunerations" ? formData["remunerations-resultat"]?.note : indicateur?.note;
  const populationFavorable =
    name === "remunerations"
      ? formData["remunerations-resultat"]?.populationFavorable
      : indicateur?.populationFavorable;
  const motifNc = indicateur?.estCalculable === "non" ? indicateur.motifNonCalculabilité : undefined;

  return (
    <RecapCard
      title={funnelStaticConfig[name].title}
      editLink={(edit || void 0) && funnelStaticConfig[name].url}
      content={
        <>
          {customContent}

          {motifNc && (
            <p>
              L'indicateur n'est pas calculable car{" "}
              {lowerFirst(NotComputableReason.Label[motifNc as NotComputableReason.Enum])}
            </p>
          )}

          {note !== undefined && (
            <IndicatorNote
              note={note}
              max={indicatorNoteMax[name]}
              text="Nombre de points obtenus à l'indicateur"
              legend={
                name === "conges-maternite"
                  ? ""
                  : populationFavorable === FavorablePopulation.Enum.EQUALITY
                  ? "Égalité de l'indicateur"
                  : name === "hautes-remunerations"
                  ? `${capitalize(populationFavorable)} sur-représenté${
                      populationFavorable === FavorablePopulation.Enum.WOMEN ? "e" : ""
                    }s`
                  : `Écart en faveur des ${populationFavorable}`
              }
            />
          )}
        </>
      }
    />
  );
};
