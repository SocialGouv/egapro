/** @jsx jsx */
import { jsx } from "@emotion/core";
import { useCallback, ReactNode } from "react";
import { RouteComponentProps } from "react-router-dom";

import {
  AppState,
  FormState,
  ActionType,
  ActionInformationsDeclarantData
} from "../../globals";

import Page from "../../components/Page";
import LayoutFormAndResult from "../../components/LayoutFormAndResult";

import InformationsDeclarantForm from "./InformationsDeclarantForm";

interface Props extends RouteComponentProps {
  state: AppState;
  dispatch: (action: ActionType) => void;
}

function InformationsDeclarant({ state, dispatch }: Props) {
  const updateInformationsDeclarant = useCallback(
    (data: ActionInformationsDeclarantData) =>
      dispatch({ type: "updateInformationsDeclarant", data }),
    [dispatch]
  );

  const validateInformationsDeclarant = useCallback(
    (valid: FormState) =>
      dispatch({ type: "validateInformationsDeclarant", valid }),
    [dispatch]
  );

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
  );
}

function PageInformationsDeclarant({ children }: { children: ReactNode }) {
  return (
    <Page
      title="Information société"
      tagline="Renseignez le nom de votre entreprise, ainsi que son Siren, CodeNaf et adresse"
    >
      {children}
    </Page>
  );
}

export default InformationsDeclarant;
