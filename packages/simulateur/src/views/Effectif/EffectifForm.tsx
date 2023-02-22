import React, { FunctionComponent, useMemo } from "react"
import { FormState, EffectifPourTrancheAge } from "../../globals"

import { ButtonSimulatorLink } from "../../components/SimulatorLink"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import { displayNameCSP } from "../../utils/helpers"
import EffectifFormRaw from "./EffectifFormRaw"
import { isFormValid } from "../../utils/formHelpers"

const EffectifForm: FunctionComponent = () => {
  const { state, dispatch } = useAppStateContextProvider()

  const effectif = state?.effectif

  const effectifRaw = useMemo(
    () =>
      effectif?.nombreSalaries.map(({ categorieSocioPro, tranchesAges }) => ({
        id: categorieSocioPro,
        name: displayNameCSP(categorieSocioPro),
        tranchesAges,
      })),
    [effectif],
  )

  const validateEffectif = (valid: FormState) => dispatch({ type: "validateEffectif", valid })

  const updateEffectifRaw = (
    data: Array<{
      id: any
      name: string
      tranchesAges: EffectifPourTrancheAge[]
    }>,
  ) => {
    const nombreSalaries = data.map(({ id, tranchesAges }) => ({
      categorieSocioPro: id,
      tranchesAges,
    }))

    dispatch({ type: "updateEffectif", data: { nombreSalaries } })
  }

  if (!state || !effectifRaw) return null

  const readOnly = isFormValid(state.effectif)

  return (
    <EffectifFormRaw
      effectifRaw={effectifRaw}
      readOnly={readOnly}
      updateEffectif={updateEffectifRaw}
      validateEffectif={validateEffectif}
      nextLink={<ButtonSimulatorLink to="/indicateur1" label="Suivant" />}
    />
  )
}

export default EffectifForm
