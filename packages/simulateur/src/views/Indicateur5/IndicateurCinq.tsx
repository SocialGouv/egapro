import React, { useCallback, FunctionComponent } from "react"
import { RouteComponentProps } from "react-router-dom"

import { AppState, FormState, ActionType, ActionIndicateurCinqData } from "../../globals"
import calculIndicateurCinq from "../../utils/calculsEgaProIndicateurCinq"
import { useTitle } from "../../utils/hooks"

import Page from "../../components/Page"
import LayoutFormAndResult from "../../components/LayoutFormAndResult"
import IndicateurCinqForm from "./IndicateurCinqForm"
import IndicateurCinqResult from "./IndicateurCinqResult"

interface IndicateurCinqProps extends RouteComponentProps {
  state: AppState
  dispatch: (action: ActionType) => void
}

const title = "Indicateur hautes rémunérations"

const IndicateurCinq: FunctionComponent<IndicateurCinqProps> = ({ state, dispatch }) => {
  useTitle(title)

  const updateIndicateurCinq = useCallback(
    (data: ActionIndicateurCinqData) => dispatch({ type: "updateIndicateurCinq", data }),
    [dispatch],
  )

  const validateIndicateurCinq = useCallback(
    (valid: FormState) => dispatch({ type: "validateIndicateurCinq", valid }),
    [dispatch],
  )

  const { indicateurSexeSousRepresente, indicateurNombreSalariesSexeSousRepresente, noteIndicateurCinq } =
    calculIndicateurCinq(state)

  return (
    <PageIndicateurCinq>
      <LayoutFormAndResult
        childrenForm={
          <IndicateurCinqForm
            indicateurCinq={state.indicateurCinq}
            readOnly={state.indicateurCinq.formValidated === "Valid"}
            updateIndicateurCinq={updateIndicateurCinq}
            validateIndicateurCinq={validateIndicateurCinq}
          />
        }
        childrenResult={
          state.indicateurCinq.formValidated === "Valid" && (
            <IndicateurCinqResult
              indicateurSexeSousRepresente={indicateurSexeSousRepresente}
              indicateurNombreSalariesSexeSousRepresente={indicateurNombreSalariesSexeSousRepresente}
              noteIndicateurCinq={noteIndicateurCinq}
              validateIndicateurCinq={validateIndicateurCinq}
            />
          )
        }
      />
    </PageIndicateurCinq>
  )
}

const PageIndicateurCinq: FunctionComponent = ({ children }) => (
  <Page
    title="Indicateur nombre de salariés du sexe sous-représenté parmi les 10 plus hautes rémunérations"
    tagline="Renseignez le nombre de femmes et d'hommes parmi les 10 plus hautes rémunérations durant la période de référence."
  >
    {children}
  </Page>
)

export default IndicateurCinq
