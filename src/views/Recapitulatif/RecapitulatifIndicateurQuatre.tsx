/** @jsx jsx */
import { css, jsx } from "@emotion/react"
import { Fragment } from "react"

import { FormState } from "../../globals"

import { displayPercent } from "../../utils/helpers"

import InfoBloc from "../../components/InfoBloc"
import RecapBloc from "./components/RecapBloc"
import { TextSimulatorLink } from "../../components/SimulatorLink"

interface Props {
  indicateurQuatreFormValidated: FormState
  indicateurQuatreCalculable: boolean
  indicateurEcartNombreSalarieesAugmentees: number | undefined
  presenceCongeMat: boolean
  nombreSalarieesPeriodeAugmentation: number | undefined
  noteIndicateurQuatre: number | undefined
}

function RecapitulatifIndicateurQuatre({
  indicateurQuatreFormValidated,
  indicateurQuatreCalculable,
  indicateurEcartNombreSalarieesAugmentees,
  presenceCongeMat,
  nombreSalarieesPeriodeAugmentation,
  noteIndicateurQuatre,
}: Props) {
  if (indicateurQuatreFormValidated !== "Valid") {
    return (
      <div css={styles.container}>
        <InfoBloc
          title="Indicateur pourcentage de salariées augmentées dans l'année suivant leur retour de congé maternité"
          text={
            <Fragment>
              <span>
                Nous ne pouvons pas calculer votre indicateur car vous n’avez pas encore validé vos données saisies.
              </span>{" "}
              <TextSimulatorLink to="/indicateur4" label="valider les données" />
            </Fragment>
          }
        />
      </div>
    )
  }

  if (!indicateurQuatreCalculable) {
    const messageNonCalculable =
      presenceCongeMat && nombreSalarieesPeriodeAugmentation !== undefined && nombreSalarieesPeriodeAugmentation === 0
        ? "d’augmentations salariales pendant la durée du ou des congés maternité"
        : "de retour de congé maternité pendant la période de référence."
    return (
      <div css={styles.container}>
        <InfoBloc
          title="Indicateur pourcentage de salariées augmentées dans l'année suivant leur retour de congé maternité"
          text={`Malheureusement votre indicateur n’est pas calculable car il n'y a pas eu ${messageNonCalculable}`}
        />
      </div>
    )
  }

  return (
    <div css={styles.container}>
      <RecapBloc
        title="Indicateur pourcentage de salariées augmentées dans l'année suivant leur retour de congé maternité"
        resultBubble={{
          firstLineLabel: "votre résultat final est",
          firstLineData:
            indicateurEcartNombreSalarieesAugmentees !== undefined
              ? displayPercent(indicateurEcartNombreSalarieesAugmentees)
              : "--",
          secondLineLabel: "votre note obtenue est",
          secondLineData: (noteIndicateurQuatre !== undefined ? noteIndicateurQuatre : "--") + "/15",
          indicateurSexeSurRepresente: "femmes",
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

export default RecapitulatifIndicateurQuatre
