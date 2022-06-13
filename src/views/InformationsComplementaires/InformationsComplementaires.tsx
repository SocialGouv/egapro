import React, { FunctionComponent } from "react"
import { RouteComponentProps } from "react-router-dom"

import { AppState, ActionType } from "../../globals"

import { useTitle } from "../../utils/hooks"

import Page from "../../components/Page"
import LayoutFormAndResult from "../../components/LayoutFormAndResult"
import InformationsComplementairesForm from "./InformationsComplementairesForm"

interface InformationsComplementairesProps extends RouteComponentProps {
  state: AppState
  dispatch: (action: ActionType) => void
}

const title = "Informations complémentaires"

const InformationsComplementaires: FunctionComponent<InformationsComplementairesProps> = ({ state, dispatch }) => {
  useTitle(title)

  return (
    <PageInformationsComplementaires>
      <LayoutFormAndResult
        childrenForm={
          <InformationsComplementairesForm
            state={state}
            dispatch={dispatch}
            readOnly={state.informationsComplementaires.formValidated === "Valid"}
          />
        }
      />
    </PageInformationsComplementaires>
  )
}

const PageInformationsComplementaires: FunctionComponent = ({ children }) => (
  <Page title={title} tagline="Renseignez les informations de publication et informations complémentaires.">
    {children}
  </Page>
)

export default InformationsComplementaires
