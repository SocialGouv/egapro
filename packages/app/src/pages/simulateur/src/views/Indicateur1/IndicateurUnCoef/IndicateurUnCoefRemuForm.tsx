/** @jsxImportSource @emotion/react */
import { useCallback } from "react"

import { AppState, FormState, ActionIndicateurUnCoefData, GroupTranchesAgesIndicateurUn } from "../../../globals"
import calculIndicateurUn from "../../../utils/calculsEgaProIndicateurUn"
import LayoutFormAndResult from "../../../components/LayoutFormAndResult"
import InfoBlock from "../../../components/ds/InfoBlock"
import ActionLink from "../../../components/ActionLink"
import { ButtonSimulatorLink } from "../../../components/SimulatorLink"
import IndicateurUnFormRaw from "../IndicateurUnFormRaw"
import IndicateurUnResult from "../IndicateurUnResult"

interface Props {
  state: AppState
  updateIndicateurUnCoef: (data: ActionIndicateurUnCoefData) => void
  validateIndicateurUn: (valid: FormState) => void
  navigateToEffectif: () => void
}

function IndicateurUnCoefEffectifForm({
  state,
  updateIndicateurUnCoef,
  validateIndicateurUn,
  navigateToEffectif,
}: Props) {
  const { coefficientEffectifFormValidated, formValidated } = state.indicateurUn

  const {
    effectifsIndicateurCalculable,
    effectifEtEcartRemuParTrancheCoef,
    indicateurEcartRemuneration,
    indicateurSexeSurRepresente,
    noteIndicateurUn,
  } = calculIndicateurUn(state)

  const updateIndicateurUn = useCallback(
    (
      data: Array<{
        id: any
        tranchesAges: Array<GroupTranchesAgesIndicateurUn>
      }>,
    ) => {
      const coefficient = data.map(({ tranchesAges }) => ({
        tranchesAges,
      }))
      updateIndicateurUnCoef({ coefficient })
    },
    [updateIndicateurUnCoef],
  )

  // le formulaire d'effectif n'est pas validé
  if (coefficientEffectifFormValidated !== "Valid") {
    return (
      <InfoBlock
        type="warning"
        title="Vous devez renseignez vos effectifs avant d’avoir accès à cet indicateur"
        text={<ActionLink onClick={navigateToEffectif}>Renseigner les effectifs</ActionLink>}
      />
    )
  }

  // les effectifs ne permettent pas de calculer l'indicateur
  if (!effectifsIndicateurCalculable) {
    return (
      <div>
        <InfoBlock
          type="warning"
          title="Malheureusement votre indicateur n’est pas calculable en niveau ou coefficient hiérarchique"
          text="L’ensemble des groupes valables (c’est-à-dire comptant au
              moins 3 femmes et 3 hommes), représentent moins de 40% des
              effectifs. Vous devez calculer par CSP."
        />
      </div>
    )
  }

  const readOnly = formValidated === "Valid"

  return (
    <LayoutFormAndResult
      childrenForm={
        <IndicateurUnFormRaw
          ecartRemuParTrancheAge={effectifEtEcartRemuParTrancheCoef}
          readOnly={readOnly}
          updateIndicateurUn={updateIndicateurUn}
          validateIndicateurUn={validateIndicateurUn}
          nextLink={
            <ButtonSimulatorLink
              to={state.informations.trancheEffectifs === "50 à 250" ? "/indicateur2et3" : "/indicateur2"}
              label="Suivant"
            />
          }
        />
      }
      childrenResult={
        readOnly && (
          <IndicateurUnResult
            indicateurEcartRemuneration={indicateurEcartRemuneration}
            indicateurSexeSurRepresente={indicateurSexeSurRepresente}
            noteIndicateurUn={noteIndicateurUn}
            validateIndicateurUn={validateIndicateurUn}
          />
        )
      }
    />
  )
}

export default IndicateurUnCoefEffectifForm
