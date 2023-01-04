import React, { FunctionComponent } from "react"

import { FormState } from "../../globals"

import { displayPercent } from "../../utils/helpers"

import InfoBlock from "../../components/ds/InfoBlock"
import { indicateursInfo } from "../../config"
import MessageWhenInvalid from "./components/MessageWhenInvalid"
import RecapBloc from "./components/RecapBloc"

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
  if (!indicateurQuatreCalculable) {
    const messageNonCalculable =
      presenceCongeMat && nombreSalarieesPeriodeAugmentation !== undefined && nombreSalarieesPeriodeAugmentation === 0
        ? "d’augmentations salariales pendant la durée du ou des congés maternité"
        : "de retour de congé maternité pendant la période de référence."
    return (
      <InfoBlock
        type="warning"
        title={indicateursInfo.indicateur4.title}
        text={`Malheureusement votre indicateur n’est pas calculable car il n'y a pas eu ${messageNonCalculable}`}
      />
    )
  }

  if (indicateurQuatreFormValidated !== "Valid") {
    return <MessageWhenInvalid indicateur="indicateur4" />
  }

  return (
    <RecapBloc
      indicateur="indicateur4"
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
