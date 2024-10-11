"use client";

import { indicatorNoteMax } from "@common/core-domain/computers/DeclarationComputer";
import { FavorablePopulation } from "@common/core-domain/domain/valueObjects/declaration/indicators/FavorablePopulation";
import { type DeclarationDTO, type IndicatorKey } from "@common/core-domain/dtos/DeclarationDTO";
import { IndicatorNote, RecapCard } from "@design-system";
import { capitalize } from "lodash";
import { type PropsWithChildren } from "react";

import { funnelStaticConfig } from "../../declarationFunnelConfiguration";

type Props = {
  customContent?: React.ReactNode;
  déclaration?: DeclarationDTO;
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

enum Enum {
  ABSAUGI = "absaugi",
  ABSAUGPDTCM = "absaugpdtcm",
  ABSPROM = "absprom",
  ABSRCM = "absrcm",
  AUCUNE_INSTANCE_DIRIGEANTE = "aucune_instance_dirigeante",
  EGVI40PCET = "egvi40pcet",
  ETSNO5F5H = "etsno5f5h",
}

const label = {
  [Enum.ABSAUGPDTCM]: "Absence d'augmentations salariales pendant la durée du ou des congés maternité",
  [Enum.ABSRCM]: "Absence de retours de congé maternité",
  [Enum.AUCUNE_INSTANCE_DIRIGEANTE]: "Aucune instance dirigeante",
  [Enum.ABSPROM]: "Absence de promotions",
  [Enum.EGVI40PCET]:
    "Effectif des groupes retenus inférieur à 40% de l'effectif pris en compte pour le calcul des indicateurs",
  [Enum.ABSAUGI]: "Absence d'augmentations individuelles",
  [Enum.ETSNO5F5H]: "Les effectifs comprennent moins de 5 femmes ou moins de 5 hommes",
};

export const RecapCardIndicator = ({ name, customContent, edit, déclaration }: PropsWithChildren<Props>) => {
  if (!déclaration) return null;
  const indicateur = déclaration[name] as unknown as GenericFieldIndicator;

  const note = name === "remunerations" ? déclaration["remunerations-resultat"]?.note : indicateur?.note;
  const populationFavorable =
    name === "remunerations"
      ? déclaration["remunerations-resultat"]?.populationFavorable
      : indicateur?.populationFavorable;
  const motifNc = indicateur?.estCalculable === "non" ? indicateur.motifNonCalculabilité : undefined;

  const getLegend = () => {
    if (name === "conges-maternite") {
      return "";
    } else if (populationFavorable === FavorablePopulation.Enum.EQUALITY) {
      return "Égalité de l'indicateur";
    } else if (populationFavorable === undefined) {
      return "Les femmes et les hommes sont à parité";
    } else if (name === "hautes-remunerations") {
      return `${capitalize(populationFavorable)} sur-représenté${
        populationFavorable === FavorablePopulation.Enum.WOMEN ? "e" : ""
      }s`;
    } else {
      return `Écart en faveur des ${populationFavorable}`;
    }
  };

  const getNxText = () => {
    if (name === "conges-maternite") {
      return "L'indicateur retour de congé maternité n'est pas calculable";
    } else if (name === "remunerations") {
      return "L'indicateur écart de rémunération n'est pas calculable";
    } else if (name === "promotions") {
      return "L'indicateur écart de taux de promotions n'est pas calculable";
    } else if (name === "augmentations") {
      return "L'indicateur écart de taux d'augmentations n'est pas calculable";
    } else return "L'indicateur écart de taux d'augmentations n'est pas calculable";
  };

  return (
    <RecapCard
      title={funnelStaticConfig[name].title}
      editLink={(edit || void 0) && funnelStaticConfig[name].url}
      content={
        <>
          {customContent}

          {motifNc && (
            <IndicatorNote noBorder note="NC" size="small" text={getNxText()} legend={label[motifNc as Enum]} />
          )}

          {note !== undefined && !motifNc && (
            <IndicatorNote
              note={note}
              max={indicatorNoteMax[name]}
              text="Nombre de points obtenus à l'indicateur"
              legend={getLegend()}
            />
          )}
        </>
      }
    />
  );
};
