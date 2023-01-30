import React, { useMemo, useCallback, FunctionComponent } from "react"
import { AppState, FormState, GroupTranchesAgesEffectif, ActionEffectifData } from "../../globals"

import { displayNameCategorieSocioPro } from "../../utils/helpers"
import { ButtonSimulatorLink } from "../../components/SimulatorLink"
import EffectifFormRaw from "./EffectifFormRaw"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"

interface EffectifFormProps {
  updateEffectif: (data: ActionEffectifData) => void
  validateEffectif: (valid: FormState) => void
}

const EffectifForm: FunctionComponent<EffectifFormProps> = ({ updateEffectif, validateEffectif }) => {
  const { state } = useAppStateContextProvider()

  const effectif = state.effectif

  const effectifRaw = useMemo(
    () =>
      effectif.nombreSalaries.map(({ categorieSocioPro, tranchesAges }) => ({
        id: categorieSocioPro,
        name: displayNameCategorieSocioPro(categorieSocioPro),
        tranchesAges,
      })),
    [effectif],
  )

  const updateEffectifRaw = useCallback(
    (
      data: Array<{
        id: any
        name: string
        tranchesAges: Array<GroupTranchesAgesEffectif>
      }>,
    ) => {
      const nombreSalaries = data.map(({ id, tranchesAges }) => ({
        categorieSocioPro: id,
        tranchesAges,
      }))
      updateEffectif({ nombreSalaries })
    },
    [updateEffectif],
  )

  if (!state) return null

  const readOnly = state.effectif.formValidated === "Valid"

  return (
    <EffectifFormRaw
      effectifRaw={effectifRaw}
      readOnly={readOnly}
      updateEffectif={updateEffectifRaw}
      validateEffectif={validateEffectif}
    />
  )
}

export default EffectifForm
