import React, { useCallback, FunctionComponent } from "react"
import { RouteComponentProps } from "react-router-dom"

import { AppState, FormState, ActionType, ActionIndicateurQuatreData } from "../../globals"

import { useTitle } from "../../utils/hooks"

import calculIndicateurQuatre from "../../utils/calculsEgaProIndicateurQuatre"

import InfoBlock from "../../components/ds/InfoBlock"
import Page from "../../components/Page"
import LayoutFormAndResult from "../../components/LayoutFormAndResult"
import ActionBar from "../../components/ActionBar"
import ActionLink from "../../components/ActionLink"
import { ButtonSimulatorLink } from "../../components/SimulatorLink"
import IndicateurQuatreForm from "./IndicateurQuatreForm"
import IndicateurQuatreResult from "./IndicateurQuatreResult"

interface IndicateurQuatreProps extends RouteComponentProps {
  state: AppState
  dispatch: (action: ActionType) => void
}

const title = "Indicateur retour congé maternité"

const IndicateurQuatre: FunctionComponent<IndicateurQuatreProps> = ({ state, dispatch }) => {
  useTitle(title)

  const updateIndicateurQuatre = useCallback(
    (data: ActionIndicateurQuatreData) => dispatch({ type: "updateIndicateurQuatre", data }),
    [dispatch],
  )

  const validateIndicateurQuatre = useCallback(
    (valid: FormState) => dispatch({ type: "validateIndicateurQuatre", valid }),
    [dispatch],
  )

  const { indicateurCalculable, indicateurEcartNombreSalarieesAugmentees, noteIndicateurQuatre } =
    calculIndicateurQuatre(state)

  // formulaire indicateur validé mais données renseignées ne permettent pas de calculer l'indicateur
  if (state.indicateurQuatre.formValidated === "Valid" && !indicateurCalculable) {
    const messageNonCalculable =
      state.indicateurQuatre.presenceCongeMat &&
      state.indicateurQuatre.nombreSalarieesPeriodeAugmentation !== undefined &&
      state.indicateurQuatre.nombreSalarieesPeriodeAugmentation === 0
        ? "Il n’y a pas eu d’augmentations salariales pendant la durée du ou des congés maternité."
        : "Il n’y a pas eu de retour de congé maternité pendant la période de référence."
    return (
      <PageIndicateurQuatre>
        <div>
          <InfoBlock
            type="warning"
            title="Malheureusement votre indicateur n’est pas calculable"
            text={messageNonCalculable}
          />
          <ActionBar>
            <ActionLink onClick={() => validateIndicateurQuatre("None")}>Modifier les données saisies</ActionLink>
          </ActionBar>
          <ActionBar>
            <ButtonSimulatorLink to="/indicateur5" label="Suivant" />
          </ActionBar>
        </div>
      </PageIndicateurQuatre>
    )
  }

  return (
    <PageIndicateurQuatre>
      <LayoutFormAndResult
        childrenForm={
          <IndicateurQuatreForm
            indicateurQuatre={state.indicateurQuatre}
            readOnly={state.indicateurQuatre.formValidated === "Valid"}
            updateIndicateurQuatre={updateIndicateurQuatre}
            validateIndicateurQuatre={validateIndicateurQuatre}
          />
        }
        childrenResult={
          state.indicateurQuatre.formValidated === "Valid" && (
            <IndicateurQuatreResult
              indicateurEcartNombreSalarieesAugmentees={indicateurEcartNombreSalarieesAugmentees}
              noteIndicateurQuatre={noteIndicateurQuatre}
              validateIndicateurQuatre={validateIndicateurQuatre}
            />
          )
        }
      />
    </PageIndicateurQuatre>
  )
}

const PageIndicateurQuatre: FunctionComponent = ({ children }) => (
  <Page
    title="Indicateur pourcentage de salariées augmentées dans l'année suivant leur retour de congé maternité"
    tagline="Renseignez le nombre de salariées en congé maternité durant la période de référence et ayant reçu une augmentation à leur retour."
  >
    {children}
  </Page>
)

export default IndicateurQuatre
