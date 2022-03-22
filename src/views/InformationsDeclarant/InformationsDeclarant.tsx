/** @jsxImportSource @emotion/react */
import { jsx } from "@emotion/react"
import { useCallback, ReactNode } from "react"
import { RouteComponentProps } from "react-router-dom"

import { AppState, FormState, ActionType, ActionInformationsDeclarantData } from "../../globals"

import Page from "../../components/Page"
import LayoutFormAndResult from "../../components/LayoutFormAndResult"

import InformationsDeclarantForm from "./InformationsDeclarantForm"
import { useTitle } from "../../utils/hooks"

interface Props extends RouteComponentProps {
  state: AppState
  dispatch: (action: ActionType) => void
}

const title = "Informations déclarant"

function InformationsDeclarant({ state, dispatch }: Props) {
  useTitle(title)

  const updateInformationsDeclarant = useCallback(
    (data: ActionInformationsDeclarantData) => dispatch({ type: "updateInformationsDeclarant", data }),
    [dispatch],
  )

  const validateInformationsDeclarant = useCallback(
    (valid: FormState) => dispatch({ type: "validateInformationsDeclarant", valid }),
    [dispatch],
  )

  return (
    <PageInformationsDeclarant>
      <LayoutFormAndResult
        childrenForm={
          <InformationsDeclarantForm
            informationsDeclarant={state.informationsDeclarant}
            readOnly={state.informationsDeclarant.formValidated === "Valid"}
            updateInformationsDeclarant={updateInformationsDeclarant}
            validateInformationsDeclarant={validateInformationsDeclarant}
          />
        }
        childrenResult={null}
      />
    </PageInformationsDeclarant>
  )
}

function PageInformationsDeclarant({ children }: { children: ReactNode }) {
  return (
    <Page title={title} tagline="Renseignez le nom du déclarant, ainsi que son prénom, numéro de téléphone et email">
      {children}
    </Page>
  )
}

export default InformationsDeclarant
