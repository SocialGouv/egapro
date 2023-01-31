import React, { FunctionComponent } from "react"

import { displayPercent, displaySexeSurRepresente } from "../../utils/helpers"

import ResultSummary from "../../components/ResultSummary"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import calculIndicateurDeux from "../../utils/calculsEgaProIndicateurDeux"

interface IndicateurDeuxResultProps {
  calculsIndicateurDeux: Pick<
    ReturnType<typeof calculIndicateurDeux>,
    "indicateurEcartAugmentation" | "indicateurSexeSurRepresente" | "noteIndicateurDeux" | "correctionMeasure"
  >
}

const IndicateurDeuxResult: FunctionComponent<IndicateurDeuxResultProps> = ({ calculsIndicateurDeux }) => {
  const { state, dispatch } = useAppStateContextProvider()

  const { indicateurEcartAugmentation, indicateurSexeSurRepresente, noteIndicateurDeux, correctionMeasure } =
    calculsIndicateurDeux

  if (!state) return null

  return (
    <ResultSummary
      firstLineLabel="votre résultat final est"
      firstLineData={indicateurEcartAugmentation !== undefined ? displayPercent(indicateurEcartAugmentation) : "--"}
      firstLineInfo={displaySexeSurRepresente(indicateurSexeSurRepresente)}
      secondLineLabel="votre note obtenue est"
      secondLineData={(noteIndicateurDeux !== undefined ? noteIndicateurDeux : "--") + "/20"}
      secondLineInfo={correctionMeasure ? "** mesures de correction prises en compte" : undefined}
      indicateurSexeSurRepresente={indicateurSexeSurRepresente}
      onEdit={() => dispatch({ type: "validateIndicateurDeux", valid: "None" })}
    />
  )
}

export default IndicateurDeuxResult
