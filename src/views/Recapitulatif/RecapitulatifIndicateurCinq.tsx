/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react"
import { Fragment } from "react"

import { FormState } from "../../globals"

import InfoBlock from "../../components/ds/InfoBlock"
import RecapBloc from "./components/RecapBloc"
import { TextSimulatorLink } from "../../components/SimulatorLink"

interface Props {
  indicateurCinqFormValidated: FormState
  indicateurSexeSousRepresente: "hommes" | "femmes" | "egalite" | undefined
  indicateurNombreSalariesSexeSousRepresente: number | undefined
  noteIndicateurCinq: number | undefined
}

function RecapitulatifIndicateurCinq({
  indicateurCinqFormValidated,
  indicateurSexeSousRepresente,
  indicateurNombreSalariesSexeSousRepresente,
  noteIndicateurCinq,
}: Props) {
  if (indicateurCinqFormValidated !== "Valid") {
    return (
      <div css={styles.container}>
        <InfoBlock
          type="warning"
          title="Indicateur nombre de salariés du sexe sous-représenté parmi les 10 plus hautes rémunérations"
          text={
            <Fragment>
              Nous ne pouvons pas calculer votre indicateur car vous n’avez pas encore validé vos données saisies.{" "}
              <TextSimulatorLink to="/indicateur5" label="Valider les données" />
            </Fragment>
          }
        />
      </div>
    )
  }

  const firstLineInfo =
    indicateurSexeSousRepresente === undefined
      ? undefined
      : indicateurSexeSousRepresente === "egalite"
      ? "les femmes et les hommes sont à égalité"
      : indicateurSexeSousRepresente === "hommes"
      ? "les femmes sont sur-représentées"
      : "les hommes sont sur-représentés"

  return (
    <div css={styles.container}>
      <RecapBloc
        title="Indicateur nombre de salariés du sexe sous-représenté parmi les 10 plus hautes rémunérations"
        resultBubble={{
          firstLineLabel: "votre résultat final est",
          firstLineData:
            indicateurNombreSalariesSexeSousRepresente !== undefined
              ? String(indicateurNombreSalariesSexeSousRepresente)
              : "--",
          firstLineInfo,
          secondLineLabel: "votre note obtenue est",
          secondLineData: (noteIndicateurCinq !== undefined ? noteIndicateurCinq : "--") + "/10",
          indicateurSexeSurRepresente:
            indicateurSexeSousRepresente === undefined || indicateurSexeSousRepresente === "egalite"
              ? undefined
              : indicateurSexeSousRepresente === "hommes"
              ? "femmes"
              : "hommes",
        }}
      >
        {null}
      </RecapBloc>
    </div>
  )
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column",
    marginTop: 22,
    marginBottom: 22,
  }),
}

export default RecapitulatifIndicateurCinq
