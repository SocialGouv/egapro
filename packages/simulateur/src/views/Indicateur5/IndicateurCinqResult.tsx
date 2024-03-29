import React, { FunctionComponent } from "react"

import ResultSummary from "../../components/ResultSummary"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import calculerIndicateurCinq from "../../utils/calculsEgaProIndicateurCinq"
import { isFormValid } from "../../utils/formHelpers"

const IndicateurCinqResult: FunctionComponent = () => {
  const { state, dispatch } = useAppStateContextProvider()

  if (!state) return null

  const readOnly = isFormValid(state.indicateurCinq)

  if (!readOnly) return null

  const { indicateurSexeSousRepresente, indicateurNombreSalariesSexeSousRepresente, noteIndicateurCinq } =
    calculerIndicateurCinq(state)

  const firstLineInfo =
    indicateurSexeSousRepresente === undefined
      ? undefined
      : indicateurSexeSousRepresente === "egalite"
      ? "les femmes et les hommes sont à égalité"
      : indicateurSexeSousRepresente === "hommes"
      ? "les femmes sont sur-représentées"
      : "les hommes sont sur-représentés"
  return (
    <ResultSummary
      firstLineLabel="Votre résultat final est"
      firstLineData={
        indicateurNombreSalariesSexeSousRepresente !== undefined
          ? String(indicateurNombreSalariesSexeSousRepresente)
          : "--"
      }
      firstLineInfo={firstLineInfo}
      secondLineLabel="Votre note obtenue est"
      secondLineData={(noteIndicateurCinq !== undefined ? noteIndicateurCinq : "--") + "/10"}
      indicateurSexeSurRepresente={
        indicateurSexeSousRepresente === undefined || indicateurSexeSousRepresente === "egalite"
          ? undefined
          : indicateurSexeSousRepresente === "hommes"
          ? "femmes"
          : "hommes"
      }
      onEdit={() => dispatch({ type: "validateIndicateurCinq", valid: "None" })}
    />
  )
}

export default IndicateurCinqResult
