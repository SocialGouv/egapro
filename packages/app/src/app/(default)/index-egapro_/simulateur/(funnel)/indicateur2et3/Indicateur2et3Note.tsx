import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { type ComputedResult } from "@common/core-domain/computers/AbstractComputer";
import { type IndicateurDeuxTroisComputer } from "@common/core-domain/computers/IndicateurDeuxTroisComputer";
import { IndicateurUnComputer } from "@common/core-domain/computers/IndicateurUnComputer";
import { RemunerationsMode } from "@common/core-domain/domain/valueObjects/declaration/indicators/RemunerationsMode";
import { IndicatorNote } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { useFormContext } from "react-hook-form";

interface Props {
  computer: IndicateurDeuxTroisComputer;
  resultIndicateurUn: ComputedResult;
}

const NOTE_MAX_INDICATEUR1 = new IndicateurUnComputer(RemunerationsMode.Enum.CSP).NOTE_TABLE[0];

export const Indicateur2et3Note = ({ computer, resultIndicateurUn }: Props) => {
  const {
    formState: { isValid },
  } = useFormContext();

  const NOTE_MAX = computer.NOTE_TABLE[0];

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

  const remunerationsCompensated =
    computed &&
    isValid &&
    resultIndicateurUn.note < NOTE_MAX_INDICATEUR1 &&
    resultIndicateurUn.genderAdvantage !== computed.genderAdvantage;

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
          note="NC"
          size="small"
          text="L'indicateur écart de taux d'augmentations est non calculable"
          legend="Les effectifs comprennent moins de 5 femmes ou moins de 5 hommes"
        />
      ) : (
        <>
          <IndicatorNote
            className={fr.cx("fr-mb-2w")}
            size="small"
            classes={{
              note: fr.cx("fr-ml-n2w"),
            }}
            note={isValid ? computed?.note ?? 0 : "-"}
            text="Nombre de points obtenus sur le résultat en points de pourcentage"
          />
          <IndicatorNote
            className={fr.cx("fr-mb-2w")}
            size="small"
            classes={{
              note: fr.cx("fr-ml-n2w"),
            }}
            note={isValid ? computed?.noteEquivalentEmployeeCountGap ?? 0 : "-"}
            text="Nombre de points obtenus sur le résultat en nombre de salariés"
          />
          {remunerationsCompensated ? (
            <IndicatorNote
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
              <Alert
                className={fr.cx("fr-mb-4w", "fr-mt-4w")}
                small
                severity="info"
                description="Le nombre de points retenu pour l'indicateur est le plus élevé."
              />
              <IndicatorNote
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
