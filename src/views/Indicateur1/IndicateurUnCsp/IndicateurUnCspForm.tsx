import React, { useMemo, useCallback, FunctionComponent } from "react"
import { ActionIndicateurUnCspData, AppState, GroupTranchesAgesIndicateurUn, FormState } from "../../../globals"

import { effectifEtEcartRemuGroupCsp } from "../../../utils/calculsEgaProIndicateurUn"
import { displayNameCategorieSocioPro } from "../../../utils/helpers"

import { ButtonSimulatorLink } from "../../../components/SimulatorLink"

import IndicateurUnFormRaw from "../IndicateurUnFormRaw"

interface IndicateurUnCspFormProps {
  state: AppState
  ecartRemuParTrancheAge: Array<effectifEtEcartRemuGroupCsp>
  readOnly: boolean
  updateIndicateurUn: (data: ActionIndicateurUnCspData) => void
  validateIndicateurUn: (valid: FormState) => void
}

const IndicateurUnCspForm: FunctionComponent<IndicateurUnCspFormProps> = ({
  state,
  ecartRemuParTrancheAge,
  readOnly,
  updateIndicateurUn,
  validateIndicateurUn,
}) => {
  const ecartRemuParTrancheAgeRaw = useMemo(
    () =>
      ecartRemuParTrancheAge.map(({ categorieSocioPro, ...otherAttr }) => ({
        id: categorieSocioPro,
        name: displayNameCategorieSocioPro(categorieSocioPro),
        ...otherAttr,
      })),
    [ecartRemuParTrancheAge],
  )

  const updateIndicateurUnRaw = useCallback(
    (
      data: Array<{
        id: any
        tranchesAges: Array<GroupTranchesAgesIndicateurUn>
      }>,
    ) => {
      const remunerationAnnuelle = data.map(({ id, tranchesAges }) => ({
        categorieSocioPro: id,
        tranchesAges,
      }))
      updateIndicateurUn({ remunerationAnnuelle })
    },
    [updateIndicateurUn],
  )

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
