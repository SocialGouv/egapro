import React, { FunctionComponent } from "react"

import { FormState } from "../../globals"

import { displayPercent } from "../../utils/helpers"

import InfoBlock from "../../components/ds/InfoBlock"
import RecapBloc from "./components/RecapBloc"
import { TextSimulatorLink } from "../../components/SimulatorLink"
import { Text } from "@chakra-ui/react"

interface RecapitulatifIndicateurQuatreProps {
  indicateurQuatreFormValidated: FormState
  indicateurQuatreCalculable: boolean
  indicateurEcartNombreSalarieesAugmentees: number | undefined
  presenceCongeMat: boolean
  nombreSalarieesPeriodeAugmentation: number | undefined
  noteIndicateurQuatre: number | undefined
}

const RecapitulatifIndicateurQuatre: FunctionComponent<RecapitulatifIndicateurQuatreProps> = ({
  indicateurQuatreFormValidated,
  indicateurQuatreCalculable,
  indicateurEcartNombreSalarieesAugmentees,
  presenceCongeMat,
  nombreSalarieesPeriodeAugmentation,
  noteIndicateurQuatre,
}) => {
  if (indicateurQuatreFormValidated !== "Valid") {
    return (
      <InfoBlock
        type="warning"
        title="Indicateur pourcentage de salariées augmentées dans l'année suivant leur retour de congé maternité"
        text={
          <>
            <Text>
              L’indicateur ne peut être calculé car vous n’avez pas validé les informations nécessaires à son calcul.
            </Text>
            <Text mt={1}>
              <TextSimulatorLink to="/indicateur4" label="Valider les informations" />
            </Text>
          </>
        }
      />
    )
  }

  if (!indicateurQuatreCalculable) {
    const messageNonCalculable =
      presenceCongeMat && nombreSalarieesPeriodeAugmentation !== undefined && nombreSalarieesPeriodeAugmentation === 0
        ? "d’augmentations salariales pendant la durée du ou des congés maternité"
        : "de retour de congé maternité pendant la période de référence."
    return (
      <InfoBlock
        type="warning"
        title="Indicateur pourcentage de salariées augmentées dans l'année suivant leur retour de congé maternité"
        text={`Malheureusement votre indicateur n’est pas calculable car il n'y a pas eu ${messageNonCalculable}`}
      />
    )
  }

  return (
    <RecapBloc
      title="Indicateur pourcentage de salariées augmentées dans l'année suivant leur retour de congé maternité"
      resultSummary={{
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
  )
}

export default RecapitulatifIndicateurQuatre
