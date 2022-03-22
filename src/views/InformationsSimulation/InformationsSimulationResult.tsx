/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react"

import { FormState, TrancheEffectifs } from "../../globals"
import { calendarYear, Year } from "../../utils/helpers"

import ResultBubble from "../../components/ResultBubble"
import ActionLink from "../../components/ActionLink"

interface Props {
  nomEntreprise: string
  trancheEffectifs: TrancheEffectifs
  finPeriodeReference: string
  validateInformationsSimulation: (valid: FormState) => void
}

function InformationsSimulationResult({
  nomEntreprise,
  trancheEffectifs,
  finPeriodeReference,
  validateInformationsSimulation,
}: Props) {
  return (
    <div css={styles.container}>
      <ResultBubble
        firstLineLabel="le nom de votre entreprise"
        firstLineData={nomEntreprise}
        firstLineInfo={`votre tranche d'effectifs: ${trancheEffectifs}`}
        secondLineLabel="votre période de référence est"
        secondLineData={`${calendarYear(finPeriodeReference, Year.Subtract, 1)} au ${finPeriodeReference}`}
        indicateurSexeSurRepresente="hommes"
      />

      <p css={styles.edit}>
        <ActionLink onClick={() => validateInformationsSimulation("None")}>modifier les données saisies</ActionLink>
      </p>
    </div>
  )
}

const styles = {
  container: css({
    maxWidth: 250,
    marginTop: 64,
  }),
  edit: css({
    marginTop: 14,
    marginBottom: 14,
    textAlign: "center",
  }),
}

export default InformationsSimulationResult
