import React, { FunctionComponent } from "react"

import { displayPercent } from "../../utils/helpers"

import InfoBlock from "../../components/ds/InfoBlock"
import { indicateursInfo } from "../../config"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import calculerIndicateurQuatre from "../../utils/calculsEgaProIndicateurQuatre"
import MessageWhenInvalid from "./components/MessageWhenInvalid"
import RecapBloc from "./components/RecapBloc"
import { isFormValid } from "../../utils/formHelpers"

interface RecapitulatifIndicateurQuatreProps {
  calculsIndicateurQuatre: ReturnType<typeof calculerIndicateurQuatre>
}

const RecapitulatifIndicateurQuatre: FunctionComponent<RecapitulatifIndicateurQuatreProps> = ({
  calculsIndicateurQuatre,
}) => {
  const { state } = useAppStateContextProvider()

  if (!state) return null

  const { presenceCongeMat, nombreSalarieesPeriodeAugmentation } = state.indicateurQuatre

  const { indicateurCalculable, indicateurEcartNombreSalarieesAugmentees, noteIndicateurQuatre } =
    calculsIndicateurQuatre

  if (!isFormValid(state.indicateurQuatre)) {
    return <MessageWhenInvalid indicateur="indicateur4" />
  }

  if (!indicateurCalculable) {
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

  return (
    <RecapBloc
      indicateur="indicateur4"
      resultSummary={{
        firstLineLabel: "Votre résultat final est",
        firstLineData:
          indicateurEcartNombreSalarieesAugmentees !== undefined
            ? displayPercent(indicateurEcartNombreSalarieesAugmentees)
            : "--",
        secondLineLabel: "Votre note obtenue est",
        secondLineData: (noteIndicateurQuatre !== undefined ? noteIndicateurQuatre : "--") + "/15",
        indicateurSexeSurRepresente: "femmes",
      }}
    >
      {null}
    </RecapBloc>
  )
}

export default RecapitulatifIndicateurQuatre
