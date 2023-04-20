import React, { FunctionComponent } from "react"

import LayoutFormAndResult from "../../../components/LayoutFormAndResult"
import InfoBlock from "../../../components/ds/InfoBlock"
import { useAppStateContextProvider } from "../../../hooks/useAppStateContextProvider"
import calculerIndicateurUn from "../../../utils/calculsEgaProIndicateurUn"
import { isFormValid } from "../../../utils/formHelpers"
import IndicateurUnResult from "../IndicateurUnResult"
import IndicateurUnCspForm from "./IndicateurUnCspForm"
import { ButtonSimulatorLink } from "../../../components/SimulatorLink"

const IndicateurUnCsp: FunctionComponent = () => {
  const { state, dispatch } = useAppStateContextProvider()

  if (!state) return null

  const readOnly = isFormValid(state.indicateurUn)

  const {
    effectifEtEcartRemuParTrancheCsp,
    indicateurEcartRemuneration,
    indicateurSexeSurRepresente,
    noteIndicateurUn,
    effectifsIndicateurCalculable,
  } = calculerIndicateurUn(state)

  if (!effectifsIndicateurCalculable)
    return (
      <>
        <InfoBlock
          type="warning"
          title="Malheureusement votre indicateur n’est pas calculable"
          text="L’ensemble des groupes valables (c’est-à-dire comptant au moins 3 femmes et 3 hommes), représentent moins de 40% des effectifs."
        />
        <ButtonSimulatorLink
          to={state.informations.trancheEffectifs === "50 à 250" ? "/indicateur2et3" : "/indicateur2"}
          label="Suivant"
          fullWidth={false}
        />
      </>
    )

  return (
    <LayoutFormAndResult
      form={<IndicateurUnCspForm ecartRemuParTrancheAge={effectifEtEcartRemuParTrancheCsp} readOnly={readOnly} />}
      result={
        readOnly && (
          <IndicateurUnResult
            indicateurEcartRemuneration={indicateurEcartRemuneration}
            indicateurSexeSurRepresente={indicateurSexeSurRepresente}
            noteIndicateurUn={noteIndicateurUn}
            unsetIndicateurUn={() => dispatch({ type: "unsetIndicateurUnCSP" })}
          />
        )
      }
    />
  )
}

export default IndicateurUnCsp
