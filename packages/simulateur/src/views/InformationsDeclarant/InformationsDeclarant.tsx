import React, { useCallback, FunctionComponent, PropsWithChildren } from "react"
import { RouteComponentProps } from "react-router-dom"

import { AppState, FormState, ActionType, ActionInformationsDeclarantData } from "../../globals"

import { useTitle } from "../../utils/hooks"

import Page from "../../components/Page"
import LayoutFormAndResult from "../../components/LayoutFormAndResult"
import InformationsDeclarantForm from "./InformationsDeclarantForm"

interface InformationsDeclarantProps extends RouteComponentProps {
  state: AppState
  dispatch: (action: ActionType) => void
}

const title = "Informations déclarant"

const InformationsDeclarant: FunctionComponent<InformationsDeclarantProps> = ({ state, dispatch }) => {
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
        form={
          <InformationsDeclarantForm
            informationsDeclarant={state.informationsDeclarant}
            readOnly={state.informationsDeclarant.formValidated === "Valid"}
            updateInformationsDeclarant={updateInformationsDeclarant}
            validateInformationsDeclarant={validateInformationsDeclarant}
          />
        }
        result={null}
      />
    </PageInformationsDeclarant>
  )
}

const PageInformationsDeclarant = ({ children }: PropsWithChildren) => (
  <Page
    title={title}
    tagline="Renseignez le nom, le prénom et le numéro de téléphone du déclarant pour tout contact ultérieur par les services de l’inspection du travail."
  >
    {children}
  </Page>
)

export default InformationsDeclarant
