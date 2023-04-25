import React, { FunctionComponent, useMemo } from "react"
import { EffectifPourTrancheAge } from "../../globals"

import { ButtonSimulatorLink } from "../../components/SimulatorLink"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import { isFormValid } from "../../utils/formHelpers"
import { displayNameCSP } from "../../utils/helpers"
import EffectifFormRaw from "./EffectifFormRaw"

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
      setValidEffectif={() => dispatch({ type: "setValidEffectif" })}
      nextLink={<ButtonSimulatorLink to="/indicateur1" label="Suivant" />}
    />
  )
}

export default EffectifForm
