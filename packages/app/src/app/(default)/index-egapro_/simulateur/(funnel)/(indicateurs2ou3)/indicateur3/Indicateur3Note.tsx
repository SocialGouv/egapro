import { fr } from "@codegouvfr/react-dsfr";
import { type ComputedResult } from "@common/core-domain/computers/AbstractComputer";
import { type IndicateurTroisComputer } from "@common/core-domain/computers/IndicateurTroisComputer";
import { percentFormat } from "@common/utils/number";
import { IndicatorNote } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { useFormContext } from "react-hook-form";

interface Props {
  computer: IndicateurTroisComputer;
  resultIndicateurUn: ComputedResult;
}

const NOTE_MAX = 15;

export const Indicateur3Note = ({ computer, resultIndicateurUn }: Props) => {
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
      advantageText = "Écart de taux de promotions ";
      if (computed.note === NOTE_MAX) {
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
    computed.note < NOTE_MAX &&
    resultIndicateurUn.genderAdvantage !== computed.genderAdvantage;

  return (
    <ClientAnimate>
      {isNC ? (
        <IndicatorNote
          note={"NC"}
          size="small"
          text="L'indicateur écart de taux de promotions est non calculable"
          legend="Les catégories valides (c’est-à-dire comptant au moins 10 femmes et 10 hommes), représentent moins de 40% des effectifs"
        />
      ) : remunerationsCompensated ? (
        <IndicatorNote
          note={NOTE_MAX}
          max={NOTE_MAX}
          text="L'écart de promotions réduit l'écart de rémunération. Tous les points sont accordés."
          legend={advantageText}
        />
      ) : (
        <>
          <IndicatorNote
            className={fr.cx("fr-mb-2w")}
            size="small"
            note={percentFormat.format((computed?.result ?? 0) / 100)}
            text="Résultat final de l'indicateur écart de taux de promotions"
            legend="Arrondi à la première décimale"
          />
          <IndicatorNote
            note={isValid && computed ? computed.note : "-"}
            max={NOTE_MAX}
            text="Nombre de points obtenus à l'indicateur écart de taux de promotions"
            legend={isValid ? advantageText : "Veuillez remplir le reste des taux de promotions pour avoir votre note"}
          />
        </>
      )}
    </ClientAnimate>
  );
};
