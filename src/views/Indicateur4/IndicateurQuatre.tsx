/** @jsx jsx */
import { jsx } from "@emotion/react"
import { useCallback, ReactNode } from "react"
import { RouteComponentProps } from "react-router-dom"

import { AppState, FormState, ActionType, ActionIndicateurQuatreData } from "../../globals"

import calculIndicateurQuatre from "../../utils/calculsEgaProIndicateurQuatre"

import Page from "../../components/Page"
import LayoutFormAndResult from "../../components/LayoutFormAndResult"
import InfoBloc from "../../components/InfoBloc"
import ActionBar from "../../components/ActionBar"
import ActionLink from "../../components/ActionLink"
import { ButtonSimulatorLink } from "../../components/SimulatorLink"

import IndicateurQuatreForm from "./IndicateurQuatreForm"
import IndicateurQuatreResult from "./IndicateurQuatreResult"
import { useTitle } from "../../utils/hooks"

interface Props extends RouteComponentProps {
  state: AppState
  dispatch: (action: ActionType) => void
}

const title = "Indicateur retour congé maternité"

function IndicateurQuatre({ state, dispatch }: Props) {
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
        ? "car il n’y a pas eu d’augmentations salariales pendant la durée du ou des congés maternité"
        : "car il n’y a pas eu de retour de congé maternité pendant la période de référence."
    return (
      <PageIndicateurQuatre>
        <div>
          <InfoBloc title="Malheureusement votre indicateur n’est pas calculable" text={messageNonCalculable} />
          <ActionBar>
            <ActionLink onClick={() => validateIndicateurQuatre("None")}>modifier les données saisies</ActionLink>
          </ActionBar>
          <ActionBar>
            <ButtonSimulatorLink to="/indicateur5" label="suivant" />
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

function PageIndicateurQuatre({ children }: { children: ReactNode }) {
  return (
    <Page
      title="Indicateur pourcentage de salariées augmentées dans l'année suivant leur retour de congé maternité"
      tagline="Renseignez le nombre de salariées en congé maternité durant la période de référence et ayant reçu une augmentation à leur retour."
    >
      {children}
    </Page>
  )
}

export default IndicateurQuatre
