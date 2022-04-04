import React, { FunctionComponent } from "react"

import { FormState, TrancheEffectifs } from "../../globals"
import { calendarYear, Year } from "../../utils/helpers"

import ResultSummary from "../../components/ResultSummary"

interface InformationsSimulationResultProps {
  nomEntreprise: string
  trancheEffectifs: TrancheEffectifs
  finPeriodeReference: string
  validateInformationsSimulation: (valid: FormState) => void
}

const InformationsSimulationResult: FunctionComponent<InformationsSimulationResultProps> = ({
  nomEntreprise,
  trancheEffectifs,
  finPeriodeReference,
  validateInformationsSimulation,
}) => {
  return (
    <ResultSummary
      firstLineLabel="le nom de votre entreprise"
      firstLineData={nomEntreprise}
      firstLineInfo={`votre tranche d'effectifs: ${trancheEffectifs}`}
      secondLineLabel="votre période de référence est"
      secondLineData={`${calendarYear(finPeriodeReference, Year.Subtract, 1)} au ${finPeriodeReference}`}
      indicateurSexeSurRepresente="hommes"
      onEdit={() => validateInformationsSimulation("None")}
    />
  )
}

export default InformationsSimulationResult
