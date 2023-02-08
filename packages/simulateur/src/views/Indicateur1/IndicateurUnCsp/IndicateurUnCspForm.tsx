import React, { FunctionComponent } from "react"
import { FormState, GroupTranchesAgesIndicateurUn } from "../../../globals"

import { EffectifEtEcartRemuGroupCsp } from "../../../utils/calculsEgaProIndicateurUn"
import { displayNameCSP } from "../../../utils/helpers"

import { ButtonSimulatorLink } from "../../../components/SimulatorLink"

import { useAppStateContextProvider } from "../../../hooks/useAppStateContextProvider"
import IndicateurUnFormRaw from "../IndicateurUnFormRaw"

interface IndicateurUnCspFormProps {
  ecartRemuParTrancheAge: Array<EffectifEtEcartRemuGroupCsp>
  readOnly: boolean
  validateIndicateurUn: (valid: FormState) => void
}

const IndicateurUnCspForm: FunctionComponent<IndicateurUnCspFormProps> = ({
  ecartRemuParTrancheAge,
  readOnly,
  validateIndicateurUn,
}) => {
  const { state, dispatch } = useAppStateContextProvider()

  const ecartRemuParTrancheAgeRaw = ecartRemuParTrancheAge.map(({ categorieSocioPro, ...otherAttr }) => ({
    id: categorieSocioPro,
    name: displayNameCSP(categorieSocioPro),
    ...otherAttr,
  }))

  const updateIndicateurUnRaw = (
    data: Array<{
      id: any
      tranchesAges: Array<GroupTranchesAgesIndicateurUn>
    }>,
  ) => {
    const remunerationAnnuelle = data.map(({ id, tranchesAges }) => ({
      categorieSocioPro: id,
      tranchesAges,
    }))

    dispatch({ type: "updateIndicateurUnCsp", data: { remunerationAnnuelle } })
  }

  if (!state) return null

  return (
    <IndicateurUnFormRaw
      ecartRemuParTrancheAge={ecartRemuParTrancheAgeRaw}
      readOnly={readOnly}
      updateIndicateurUn={updateIndicateurUnRaw}
      validateIndicateurUn={validateIndicateurUn}
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
