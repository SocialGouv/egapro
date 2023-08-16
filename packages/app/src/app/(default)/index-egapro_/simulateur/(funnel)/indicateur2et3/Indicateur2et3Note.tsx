import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { type IndicateurDeuxTroisComputer } from "@common/core-domain/computers/IndicateurDeuxTroisComputer";
import { IndicatorNote } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";

interface Props {
  computer: IndicateurDeuxTroisComputer;
  isValid: boolean;
  noBorder?: boolean;
  simple?: boolean;
}

export const Indicateur2et3Note = ({ computer, isValid, simple, noBorder }: Props) => {
  const NOTE_MAX = computer.getMaxNote();

  let computed: IndicateurDeuxTroisComputer.ComputedResult | null = null;
  let isNC = false;
  let advantageText = "";
  try {
    computed = computer.compute();
    if (computed.genderAdvantage === "equality") {
      advantageText = "Les femmes et les hommes sont à égalité";
    } else {
      advantageText = "Écart d'augmentations ";
      if (computed.note === NOTE_MAX) {
        advantageText += "constaté ";
      }
      advantageText += `en faveur des ${computed.genderAdvantage === "women" ? "femmes" : "hommes"}`;
    }
    isNC = !computer.canCompute();
  } catch {
    // noop
  }

  const bestNote = isValid && computed ? Math.max(computed.note, computed.noteEquivalentEmployeeCountGap) : "-";
  const raisedCount = computer.getInput();

  return (
    <ClientAnimate>
      {raisedCount?.men === 0 && raisedCount.women === 0 && (
        <Alert
          className={fr.cx("fr-mb-4w")}
          small
          severity="warning"
          description="Tous les champs ne peuvent pas être à 0 s'il y a eu des augmentations."
        />
      )}
      {isNC ? (
        <IndicatorNote
          noBorder={noBorder}
          note="NC"
          size="small"
          text="L'indicateur écart de taux d'augmentations est non calculable"
          legend="Les effectifs comprennent moins de 5 femmes ou moins de 5 hommes"
        />
      ) : (
        <>
          {!simple && (
            <>
              <IndicatorNote
                noBorder={noBorder}
                className={fr.cx("fr-mb-2w")}
                size="small"
                classes={{
                  note: fr.cx("fr-ml-n2w"),
                }}
                note={isValid ? computed?.note ?? 0 : "-"}
                text="Nombre de points obtenus sur le résultat en points de pourcentage"
              />
              <IndicatorNote
                noBorder={noBorder}
                className={fr.cx("fr-mb-2w")}
                size="small"
                classes={{
                  note: fr.cx("fr-ml-n2w"),
                }}
                note={isValid ? computed?.noteEquivalentEmployeeCountGap ?? 0 : "-"}
                text="Nombre de points obtenus sur le résultat en nombre de salariés"
              />
            </>
          )}
          {computed?.remunerationsCompensated ? (
            <IndicatorNote
              noBorder={noBorder}
              note={NOTE_MAX}
              max={NOTE_MAX}
              text="L'écart d'augmentations réduit l'écart de rémunération. Tous les points sont accordés"
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
            <>
              {!simple && (
                <Alert
                  className={fr.cx("fr-mb-4w", "fr-mt-4w")}
                  small
                  severity="info"
                  description="Le nombre de points retenu pour l'indicateur est le plus élevé."
                />
              )}
              <IndicatorNote
                noBorder={noBorder}
                note={bestNote}
                max={NOTE_MAX}
                text="Nombre de points obtenus à l'indicateur écart de taux d'augmentations"
                legend={
                  isValid ? advantageText : "Veuillez remplir le reste des taux d'augmentations pour avoir votre note"
                }
              />
            </>
          )}
        </>
      )}
    </ClientAnimate>
  );
};
