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
  advantageTextStart: "Écart de taux d'augmentations individuelles",
  ncText: "L'indicateur écart de taux d'augmentations individuelles est non calculable",
  balanceText: "L'écart d'augmentations réduit l'écart de rémunération. Tous les points sont accordés",
  resultText: "Résultat final de l'indicateur écart de taux d'augmentations individuelles",
  noteText: "Nombre de points obtenus à l'indicateur écart de taux d'augmentations individuelles",
  missingDataLegend: "Veuillez remplir le reste des taux d'augmentations individuelles pour avoir votre note",
};

const promotions = {
  advantageTextStart: "Écart de taux de promotions",
  ncText: "L'indicateur écart de taux de promotions est non calculable",
  balanceText: "L'écart de promotions réduit l'écart de rémunération. Tous les points sont accordés",
  resultText: "Résultat final de l'indicateur écart de taux de promotions",
  noteText: "Nombre de points obtenus à l'indicateur écart de taux de promotions",
  missingDataLegend: "Veuillez remplir le reste des taux de promotions pour avoir votre note",
};

export const Indicateur2ou3Note = ({ computer, indicateur, isValid, simple, noBorder }: Props) => {
  const NOTE_MAX = computer.getMaxNote();

  const texts = indicateur === 2 ? augmentations : promotions;

  let computed: IndicateurDeuxComputer.ComputedResult | null = null;
  let isNC = false;
  let advantageText = "";
  try {
    computed = computer.compute();
    if (computed.genderAdvantage === "equality") {
      advantageText = "Les femmes et les hommes sont à égalité";
    } else {
      advantageText = `${texts.advantageTextStart} `;
      if (computed.note === NOTE_MAX) {
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
          text={texts.ncText}
          legend="Les catégories valides (c’est-à-dire comptant au moins 10 femmes et 10 hommes), représentent moins de 40% des effectifs"
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
          {computed?.remunerationsCompensated ? (
            <IndicatorNote
              noBorder={noBorder}
              note={NOTE_MAX}
              max={NOTE_MAX}
              text={texts.balanceText}
              legend={
                <>
                  {advantageText}
                  <br />
                  Si l’écart constaté joue en faveur du sexe le moins bien rémunéré (indicateur - écart de
                  rémunération), la note maximale de {NOTE_MAX} points est attribuée à l’entreprise (considérant que
                  l’employeur a mis en place une politique de rattrapage adaptée).
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
