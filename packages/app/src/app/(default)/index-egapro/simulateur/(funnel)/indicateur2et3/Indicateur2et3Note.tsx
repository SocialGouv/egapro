import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { type IndicateurDeuxTroisComputer } from "@common/core-domain/computers/IndicateurDeuxTroisComputer";
import { percentFormat } from "@common/utils/number";
import { IndicatorNote } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";

interface Props {
  computer: IndicateurDeuxTroisComputer;
  /**
   * If true, display the note with more details about the result.
   *
   * Can only be used if `simple` is false.
   */
  detailed?: boolean;
  isValid: boolean;
  noBorder?: boolean;
  /**
   * If true, only display the note, without other notes or alerts
   */
  simple?: boolean;
}

export const Indicateur2et3Note = ({ computer, isValid, simple, noBorder, detailed }: Props) => {
  const NOTE_MAX = computer.getMaxNote();

  let computed: IndicateurDeuxTroisComputer.ComputedResult | null = null;
  let isNC = false;
  let advantageText = "";
  try {
    computed = computer.compute();
    if (computed.favorablePopulation === "equality" || computed.result === 0) {
      advantageText = "Les femmes et les hommes sont à parité";
    } else {
      advantageText = "Écart d'augmentations ";
      if (computed.note === NOTE_MAX) {
        advantageText += "est ";
      }
      advantageText += `en faveur des ${computed.favorablePopulation === "women" ? "femmes" : "hommes"}`;
    }
    isNC = !computer.canCompute();
  } catch {
    // noop
  }

  const isAllValuesZero = computer.getInput()?.men === 0 && computer.getInput()?.women === 0;

  return (
    <ClientAnimate>
      {isAllValuesZero && (
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
              {detailed && (
                <>
                  <IndicatorNote
                    noBorder={noBorder}
                    className={fr.cx("fr-mb-2w")}
                    size="small"
                    classes={{
                      note: fr.cx("fr-ml-n2w"),
                    }}
                    note={isValid ? percentFormat.format((computed?.result ?? 0) / 100) : "-"}
                    text="Résultat final obtenu à l'indicateur en %"
                  />
                  <IndicatorNote
                    noBorder={noBorder}
                    className={fr.cx("fr-mb-2w")}
                    size="small"
                    classes={{
                      note: fr.cx("fr-ml-n2w"),
                    }}
                    note={isValid ? computed?.equivalentEmployeeCountGap ?? 0 : "-"}
                    text="Résultat final obtenu à l'indicateur en nombre équivalent de salariés"
                  />
                </>
              )}
              <IndicatorNote
                noBorder={noBorder}
                className={fr.cx("fr-mb-2w")}
                size="small"
                classes={{
                  note: fr.cx("fr-ml-n2w"),
                }}
                note={isValid ? computed?.notePercent ?? 0 : "-"}
                text="Nombre de points obtenus sur le résultat en %"
              />
              <IndicatorNote
                noBorder={noBorder}
                className={fr.cx("fr-mb-2w")}
                size="small"
                classes={{
                  note: fr.cx("fr-ml-n2w"),
                }}
                note={isValid ? computed?.noteEquivalentEmployeeCountGap ?? 0 : "-"}
                text="Nombre de points obtenus sur le résultat en nombre de équivalent salariés"
              />
            </>
          )}
          {computed?.remunerationsCompensated ? (
            <IndicatorNote
              noBorder={noBorder}
              note={NOTE_MAX}
              max={NOTE_MAX}
              text="Nombre de points obtenus à l'indicateur écart de taux d'augmentations individuelles"
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
                note={computed?.note && isValid ? computed.note : "-"}
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
