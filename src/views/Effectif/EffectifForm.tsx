/** @jsx jsx */
import { jsx } from "@emotion/react"
import { useMemo, useCallback } from "react"
import { AppState, FormState, GroupTranchesAgesEffectif, ActionEffectifData } from "../../globals"

import { displayNameCategorieSocioPro } from "../../utils/helpers"

import { ButtonSimulatorLink } from "../../components/SimulatorLink"

import EffectifFormRaw from "./EffectifFormRaw"

interface Props {
  effectif: AppState["effectif"]
  readOnly: boolean
  updateEffectif: (data: ActionEffectifData) => void
  validateEffectif: (valid: FormState) => void
}

function EffectifForm({ effectif, readOnly, updateEffectif, validateEffectif }: Props) {
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

  return (
    <EffectifFormRaw
      effectifRaw={effectifRaw}
      readOnly={readOnly}
      updateEffectif={updateEffectifRaw}
      validateEffectif={validateEffectif}
      nextLink={<ButtonSimulatorLink to="/indicateur1" label="suivant" />}
    />
  )
}

export default EffectifForm
