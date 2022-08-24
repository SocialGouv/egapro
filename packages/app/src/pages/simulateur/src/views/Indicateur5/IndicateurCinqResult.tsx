import React, { FunctionComponent } from "react"

import { FormState } from "../../globals"

import ResultSummary from "../../components/ResultSummary"

interface IndicateurCinqResultProps {
  indicateurSexeSousRepresente: "hommes" | "femmes" | "egalite" | undefined
  indicateurNombreSalariesSexeSousRepresente: number | undefined
  noteIndicateurCinq: number | undefined
  validateIndicateurCinq: (valid: FormState) => void
}

const IndicateurCinqResult: FunctionComponent<IndicateurCinqResultProps> = ({
  indicateurSexeSousRepresente,
  indicateurNombreSalariesSexeSousRepresente,
  noteIndicateurCinq,
  validateIndicateurCinq,
}) => {
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
      firstLineLabel="votre résultat final est"
      firstLineData={
        indicateurNombreSalariesSexeSousRepresente !== undefined
          ? String(indicateurNombreSalariesSexeSousRepresente)
          : "--"
      }
      firstLineInfo={firstLineInfo}
      secondLineLabel="votre note obtenue est"
      secondLineData={(noteIndicateurCinq !== undefined ? noteIndicateurCinq : "--") + "/10"}
      indicateurSexeSurRepresente={
        indicateurSexeSousRepresente === undefined || indicateurSexeSousRepresente === "egalite"
          ? undefined
          : indicateurSexeSousRepresente === "hommes"
          ? "femmes"
          : "hommes"
      }
      onEdit={() => validateIndicateurCinq("None")}
    />
  )
}

export default IndicateurCinqResult
