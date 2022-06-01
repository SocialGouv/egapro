import React, { useCallback, FunctionComponent } from "react"
import { RouteComponentProps } from "react-router-dom"

import { AppState, FormState, ActionType, ActionInformationsProgressionCorrectionData } from "../../globals"

import { useTitle } from "../../utils/hooks"

import Page from "../../components/Page"
import LayoutFormAndResult from "../../components/LayoutFormAndResult"
import InformationsProgressionCorrectionForm from "./InformationsProgressionCorrectionForm"

interface InformationsProgressionCorrectionProps extends RouteComponentProps {
  state: AppState
  dispatch: (action: ActionType) => void
}

const title = "Objectifs de progression et mesures de correction"

const InformationsProgressionCorrection: FunctionComponent<InformationsProgressionCorrectionProps> = ({
  state,
  dispatch,
}) => {
  useTitle(title)

  const updateInformationsProgressionCorrection = useCallback(
    (data: ActionInformationsProgressionCorrectionData) =>
      dispatch({ type: "updateInformationsProgressionCorrection", data }),
    [dispatch],
  )

  const validateInformationsProgressionCorrection = useCallback(
    (valid: FormState) => dispatch({ type: "validateInformationsProgressionCorrection", valid }),
    [dispatch],
  )

  return (
    <PageInformationsProgressionCorrection>
      <LayoutFormAndResult
        childrenForm={
          <InformationsProgressionCorrectionForm
            state={state}
            informationsProgressionCorrection={state.informationsProgressionCorrection}
            readOnly={state.informationsProgressionCorrection.formValidated === "Valid"}
            updateInformationsProgressionCorrection={updateInformationsProgressionCorrection}
            validateInformationsProgressionCorrection={validateInformationsProgressionCorrection}
          />
        }
      />
    </PageInformationsProgressionCorrection>
  )
}

const PageInformationsProgressionCorrection: FunctionComponent = ({ children }) => (
  <Page title={title} tagline="Renseignez les objectifs de progression et les mesures de correction">
    {children}
  </Page>
)

export default InformationsProgressionCorrection
