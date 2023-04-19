import React, { FunctionComponent } from "react"
import { RemunerationPourTrancheAge } from "../../../globals"

import { EffectifEtEcartRemuGroupCsp } from "../../../utils/calculsEgaProIndicateurUn"
import { displayNameCSP } from "../../../utils/helpers"

import { ButtonSimulatorLink } from "../../../components/SimulatorLink"

import { useAppStateContextProvider } from "../../../hooks/useAppStateContextProvider"
import IndicateurUnFormRemu from "../IndicateurUnFormRemu"

interface IndicateurUnCspFormProps {
  ecartRemuParTrancheAge: Array<EffectifEtEcartRemuGroupCsp>
  readOnly: boolean
}

const IndicateurUnCspForm: FunctionComponent<IndicateurUnCspFormProps> = ({ ecartRemuParTrancheAge, readOnly }) => {
  const { state, dispatch } = useAppStateContextProvider()

  const ecartRemuParTrancheAgeRaw = ecartRemuParTrancheAge.map(({ categorieSocioPro, ...otherAttr }) => ({
    id: categorieSocioPro,
    nom: displayNameCSP(categorieSocioPro),
    ...otherAttr,
  }))

  const updateIndicateurUnRaw = (
    data: Array<{
      id: any
      tranchesAges: Array<RemunerationPourTrancheAge>
    }>,
  ) => {
    const remunerationAnnuelle = data.map(({ id, tranchesAges }) => ({
      categorieSocioPro: id,
      tranchesAges,
    }))

    dispatch({ type: "updateIndicateurUnCsp", data: { remunerationsAnnuelles: remunerationAnnuelle } })
  }

  if (!state) return null

  return (
    <IndicateurUnFormRemu
      ecartRemuParTrancheAge={ecartRemuParTrancheAgeRaw}
      readOnly={readOnly}
      updateIndicateurUn={updateIndicateurUnRaw}
      setValidIndicateurUn={() => dispatch({ type: "setValidIndicateurUnCSP" })}
      nextLink={
        <ButtonSimulatorLink
          to={state.informations.trancheEffectifs === "50 à 250" ? "/indicateur2et3" : "/indicateur2"}
          label="Suivant"
        />
      }
    />
  )
}

export default IndicateurUnCspForm
