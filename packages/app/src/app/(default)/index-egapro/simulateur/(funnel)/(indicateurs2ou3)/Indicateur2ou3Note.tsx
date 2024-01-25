import { fr } from "@codegouvfr/react-dsfr";
import { type IndicateurDeuxComputer } from "@common/core-domain/computers/IndicateurDeuxComputer";
import { percentFormat } from "@common/utils/number";
import { IndicatorNote } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";

interface Props {
  computer: IndicateurDeuxComputer;
  indicateur: 2 | 3;
  isValid: boolean;
  noBorder?: boolean;
  simple?: boolean;
}

const augmentations = {
  advantageTextStart: "Un écart de taux d'augmentations",
  ncText: "L'indicateur écart de taux d'augmentations individuelles est non calculable",
  balanceText: "Nombre de points obtenus à l'indicateur écart de taux d'augmentations individuelles",
  resultText: "Écart global de taux d'augmentations en valeur absolue",
  noteText: "Nombre de points obtenus à l'indicateur écart de taux d'augmentations individuelles",
  missingDataLegend:
    "Veuillez renseigner le pourcentage de salariés augmentés pour obtenir le nombre de points à l'indicateur",
};

const promotions = {
  advantageTextStart: "Un écart de taux de promotions",
  ncText: "L'indicateur écart de taux de promotions est non calculable",
  balanceText: "Nombre de points obtenus à l'indicateur écart de taux de promotions",
  resultText: "Écart global de taux de promotions en valeur absolue",
  noteText: "Nombre de points obtenus à l'indicateur écart de taux de promotions",
  missingDataLegend:
    "Veuillez renseigner le pourcentage de salariés promus pour obtenir le nombre de points à l'indicateur",
};

export const Indicateur2ou3Note = ({ computer, indicateur, isValid, simple, noBorder }: Props) => {
  const NOTE_MAX = computer.getMaxNote();

  const texts = indicateur === 2 ? augmentations : promotions;

  let computed: IndicateurDeuxComputer.ComputedResult | null = null;
  let isNC = false;
  let advantageText = "";
  try {
    computed = computer.compute();
    if (computed.favorablePopulation === "equality") {
      advantageText = "Les femmes et les hommes sont à parité";
    } else {
      advantageText = `${texts.advantageTextStart} `;
      advantageText += `est en faveur des ${computed.favorablePopulation === "women" ? "femmes" : "hommes"}`;
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
          text={texts.ncText}
          legend="L’ensemble des groupes valides (c’est-à-dire comptant au moins 10 femmes et 10 hommes), représentent moins de 40% des effectifs"
        />
      ) : (
        <>
          {!simple && (
            <IndicatorNote
              noBorder={noBorder}
              className={fr.cx("fr-mb-2w")}
              size="small"
              note={percentFormat.format((computed?.result ?? 0) / 100)}
              text={texts.resultText}
              legend="Arrondi à la première décimale"
            />
          )}
          {isValid && computed?.remunerationsCompensated ? (
            <IndicatorNote
              noBorder={noBorder}
              note={NOTE_MAX}
              max={NOTE_MAX}
              text={texts.balanceText}
              legend={
                <>
                  {advantageText}
                  <br />
                  {computed.favorablePopulation !== "equality" &&
                    "L’écart constaté étant en faveur du sexe le moins bien rémunéré (indicateur écart de rémunération), le nombre de points maximum à l’indicateur est attribué, considérant qu'une politique de rattrapage adaptée a été mise en place."}
                </>
              }
            />
          ) : (
            <IndicatorNote
              noBorder={noBorder}
              note={isValid && computed ? computed.note : "-"}
              max={NOTE_MAX}
              text={texts.noteText}
              legend={isValid ? advantageText : texts.missingDataLegend}
            />
          )}
        </>
      )}
    </ClientAnimate>
  );
};
