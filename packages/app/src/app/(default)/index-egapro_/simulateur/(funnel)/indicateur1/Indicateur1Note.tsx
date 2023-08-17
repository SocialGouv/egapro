import { fr } from "@codegouvfr/react-dsfr";
import { type ComputedResult } from "@common/core-domain/computers/AbstractComputer";
import { type IndicateurUnComputer } from "@common/core-domain/computers/IndicateurUnComputer";
import { percentFormat } from "@common/utils/number";
import { IndicatorNote } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";

interface Props {
  computer: IndicateurUnComputer;
  isValid: boolean;
  noBorder?: boolean;
  simple?: boolean;
}

export const Indicateur1Note = ({ computer, isValid, simple, noBorder }: Props) => {
  let computed: ComputedResult | null = null;
  let isNC = false;
  let advantageText = "";
  try {
    computed = computer.compute();
    if (computed.genderAdvantage === "equality") {
      advantageText = "Les femmes et les hommes sont à égalité";
    } else {
      advantageText = "Écart de rémunération ";
      if (computed.note === 40) {
        advantageText += "constaté ";
      }
      advantageText += `en faveur des ${computed.genderAdvantage === "women" ? "femmes" : "hommes"}`;
    }
    isNC = !computer.canCompute();
  } catch {
    // noop
  }

  return (
    <ClientAnimate>
      {isNC ? (
        <IndicatorNote
          noBorder={noBorder}
          note="NC"
          size="small"
          text="L'indicateur écart de rémunération est non calculable"
          legend="L’ensemble des groupes valides (c’est-à-dire comptant au moins 3 femmes et 3 hommes), représentent moins de 40% des effectifs"
        />
      ) : (
        <>
          {!simple && (
            <IndicatorNote
              noBorder={noBorder}
              className={fr.cx("fr-mb-2w")}
              size="small"
              note={percentFormat.format((computed?.result ?? 0) / 100)}
              text="Résultat final de l'indicateur écart de rémunération"
              legend="Arrondi à la première décimale"
            />
          )}
          <IndicatorNote
            noBorder={noBorder}
            note={isValid && computed ? computed.note : "-"}
            max={40}
            text="Nombre de points obtenus à l'indicateur écart de rémunération"
            legend={isValid ? advantageText : "Veuillez remplir le reste des rémunérations pour avoir votre note"}
          />
        </>
      )}
    </ClientAnimate>
  );
};
