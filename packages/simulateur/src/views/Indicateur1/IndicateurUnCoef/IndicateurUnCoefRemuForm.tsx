/** @jsxImportSource @emotion/react */

import ActionBar from "../../../components/ActionBar"
import ActionLink from "../../../components/ActionLink"
import InfoBlock from "../../../components/ds/InfoBlock"
import LayoutFormAndResult from "../../../components/LayoutFormAndResult"
import { ButtonSimulatorLink } from "../../../components/SimulatorLink"
import { RemunerationPourTrancheAge } from "../../../globals"
import { useAppStateContextProvider } from "../../../hooks/useAppStateContextProvider"
import IndicateurUnFormRaw from "../IndicateurUnFormRaw"
import IndicateurUnResult from "../IndicateurUnResult"
import { TabIndicateurUnCoef, useIndicateurUnContext } from "./IndicateurUnCoef"

interface Props {
  navigateTo: (tab: TabIndicateurUnCoef) => void
}

function IndicateurUnCoefEffectifForm({ navigateTo }: Props) {
  const { state, dispatch } = useAppStateContextProvider()

  const {
    effectifsIndicateurCalculable,
    effectifEtEcartRemuParTrancheCoef,
    indicateurEcartRemuneration,
    indicateurSexeSurRepresente,
    noteIndicateurUn,
  } = useIndicateurUnContext()

  if (!state) return null

  // const { coefficientEffectifFormValidated } = state.indicateurUn

  const { coefficientEffectifFormValidated, coefficientRemuFormValidated } = state.indicateurUn

  const updateIndicateurUn = (
    data: Array<{
      id: any
      tranchesAges: Array<RemunerationPourTrancheAge>
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
          title="Malheureusement votre indicateur n’est pas calculable"
          text="L’ensemble des groupes valables (c’est-à-dire comptant au
              moins 3 femmes et 3 hommes), représentent moins de 40% des
              effectifs. Vous devez calculer par CSP."
        />
        <ActionBar>
          <ButtonSimulatorLink
            to={state.informations.trancheEffectifs === "50 à 250" ? "/indicateur2et3" : "/indicateur2"}
            label="Suivant"
          />
        </ActionBar>
      </div>
    )
  }

  // const readOnly = isFormValid(state.indicateurUn)

  const readOnly = coefficientRemuFormValidated === "Valid"

  return (
    <LayoutFormAndResult
      form={
        <IndicateurUnFormRaw
          ecartRemuParTrancheAge={effectifEtEcartRemuParTrancheCoef}
          readOnly={readOnly}
          updateIndicateurUn={updateIndicateurUn}
          setValidIndicateurUn={() => dispatch({ type: "setValidIndicateurUnCoefRemuneration" })}
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
            unsetIndicateurUn={() => dispatch({ type: "unsetIndicateurUnCoefRemuneration" })}
          />
        )
      }
    />
  )
}

export default IndicateurUnCoefEffectifForm
