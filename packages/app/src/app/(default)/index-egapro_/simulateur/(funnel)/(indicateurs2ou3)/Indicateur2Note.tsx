import { fr } from "@codegouvfr/react-dsfr";
import { type ComputedResult } from "@common/core-domain/computers/AbstractComputer";
import { type IndicateurDeuxComputer } from "@common/core-domain/computers/IndicateurDeuxComputer";
import { percentFormat } from "@common/utils/number";
import { IndicatorNote } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { useFormContext } from "react-hook-form";

interface Props {
  computer: IndicateurDeuxComputer;
  resultIndicateurUn: ComputedResult;
}

export const Indicateur2Note = ({ computer, resultIndicateurUn }: Props) => {
  const {
    formState: { isValid },
  } = useFormContext();

  let computed: ComputedResult | null = null;
  let isNC = false;
  let advantageText = "";
  try {
    computed = computer.compute();
    if (computed.genderAdvantage === "equality") {
      advantageText = "Les femmes et les hommes sont à égalité";
    } else {
      advantageText = "Écart de taux d'augmentations individuelles ";
      if (computed.note === 20) {
        advantageText += "constaté ";
      }
      advantageText += `en faveur des ${computed.genderAdvantage === "women" ? "femmes" : "hommes"}`;
    }
    isNC = !computer.canCompute();
  } catch {
    // noop
  }

  const remunerationsCompensated =
    computed &&
    resultIndicateurUn.note < 40 &&
    computed.note < 20 &&
    resultIndicateurUn.genderAdvantage !== computed.genderAdvantage;

  return (
    <ClientAnimate>
      {isNC ? (
        <IndicatorNote
          note={"NC"}
          size="small"
          text="L'indicateur écart de taux d'augmentations individuelles est non calculable"
          legend="Les catégories valides (c’est-à-dire comptant au moins 10 femmes et 10 hommes), représentent moins de 40% des effectifs"
        />
      ) : remunerationsCompensated ? (
        <IndicatorNote
          note={20}
          max={20}
          text="L'écart d'augmentations réduit l'écart de rémunération. Tous les points sont accordés."
          legend={advantageText}
        />
      ) : (
        <>
          <IndicatorNote
            className={fr.cx("fr-mb-2w")}
            size="small"
            note={percentFormat.format((computed?.result ?? 0) / 100)}
            text="Résultat final de l'indicateur écart de taux d'augmentations individuelles"
            legend="Arrondi à la première décimale"
          />
          <IndicatorNote
            note={isValid && computed ? computed.note : "-"}
            max={20}
            text="Nombre de points obtenus à l'indicateur écart de taux d'augmentations individuelles"
            legend={
              isValid
                ? advantageText
                : "Veuillez remplir le reste des taux d'augmentations individuelles pour avoir votre note"
            }
          />
        </>
      )}
    </ClientAnimate>
  );
};
