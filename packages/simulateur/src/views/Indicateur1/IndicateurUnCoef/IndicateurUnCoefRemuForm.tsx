/** @jsxImportSource @emotion/react */

import ActionLink from "../../../components/ActionLink"
import InfoBlock from "../../../components/ds/InfoBlock"
import LayoutFormAndResult from "../../../components/LayoutFormAndResult"
import { ButtonSimulatorLink } from "../../../components/SimulatorLink"
import { GroupTranchesAgesIndicateurUn } from "../../../globals"
import { useAppStateContextProvider } from "../../../hooks/useAppStateContextProvider"
import calculerIndicateurUn from "../../../utils/calculsEgaProIndicateurUn"
import IndicateurUnFormRaw from "../IndicateurUnFormRaw"
import IndicateurUnResult from "../IndicateurUnResult"
import { TabIndicateurUnCoef } from "./IndicateurUnCoef"

interface Props {
  navigateTo: (tab: TabIndicateurUnCoef) => void
}

function IndicateurUnCoefEffectifForm({ navigateTo }: Props) {
  const { state, dispatch } = useAppStateContextProvider()

  if (!state) return null

  const { coefficientEffectifFormValidated, formValidated } = state.indicateurUn

  const {
    effectifsIndicateurCalculable,
    effectifEtEcartRemuParTrancheCoef,
    indicateurEcartRemuneration,
    indicateurSexeSurRepresente,
    noteIndicateurUn,
  } = calculerIndicateurUn(state)

  const updateIndicateurUn = (
    data: Array<{
      id: any
      tranchesAges: Array<GroupTranchesAgesIndicateurUn>
    }>,
  ) => {
    const coefficient = data.map(({ tranchesAges }) => ({
      tranchesAges,
    }))
    dispatch({ type: "updateIndicateurUnCoef", data: { coefficient } })
  }

  // le formulaire d'effectif n'est pas validé
  if (coefficientEffectifFormValidated !== "Valid") {
    return (
      <InfoBlock
        type="warning"
        title="Vous devez renseignez vos effectifs avant d’avoir accès à cet indicateur"
        text={<ActionLink onClick={() => navigateTo("Effectif")}>Renseigner les effectifs</ActionLink>}
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
      form={
        <IndicateurUnFormRaw
          ecartRemuParTrancheAge={effectifEtEcartRemuParTrancheCoef}
          readOnly={readOnly}
          updateIndicateurUn={updateIndicateurUn}
          validateIndicateurUn={(valid) => dispatch({ type: "validateIndicateurUn", valid })}
          nextLink={
            <ButtonSimulatorLink
              to={state.informations.trancheEffectifs === "50 à 250" ? "/indicateur2et3" : "/indicateur2"}
              label="Suivant"
            />
          }
        />
      }
      result={
        readOnly && (
          <IndicateurUnResult
            indicateurEcartRemuneration={indicateurEcartRemuneration}
            indicateurSexeSurRepresente={indicateurSexeSurRepresente}
            noteIndicateurUn={noteIndicateurUn}
            validateIndicateurUn={(valid) => dispatch({ type: "validateIndicateurUn", valid })}
          />
        )
      }
    />
  )
}

export default IndicateurUnCoefEffectifForm
