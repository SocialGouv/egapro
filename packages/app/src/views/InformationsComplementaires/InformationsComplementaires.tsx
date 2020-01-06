/** @jsx jsx */
import { jsx } from "@emotion/core";
import { useCallback, ReactNode } from "react";
import { RouteComponentProps } from "react-router-dom";

import {
  AppState,
  FormState,
  ActionType,
  ActionInformationsComplementairesData
} from "../../globals";

import Page from "../../components/Page";
import LayoutFormAndResult from "../../components/LayoutFormAndResult";

import InformationsComplementairesForm from "./InformationsComplementairesForm";

interface Props extends RouteComponentProps {
  state: AppState;
  dispatch: (action: ActionType) => void;
}

function InformationsComplementaires({ state, dispatch }: Props) {
  const updateInformationsComplementaires = useCallback(
    (data: ActionInformationsComplementairesData) =>
      dispatch({ type: "updateInformationsComplementaires", data }),
    [dispatch]
  );

  const validateInformationsComplementaires = useCallback(
    (valid: FormState) =>
      dispatch({ type: "validateInformationsComplementaires", valid }),
    [dispatch]
  );

  return (
    <PageInformationsComplementaires>
      <LayoutFormAndResult
        childrenForm={
          <InformationsComplementairesForm
            informationsComplementaires={state.informationsComplementaires}
            readOnly={
              state.informationsComplementaires.formValidated === "Valid"
            }
            updateInformationsComplementaires={
              updateInformationsComplementaires
            }
            validateInformationsComplementaires={
              validateInformationsComplementaires
            }
          />
        }
        childrenResult={null}
      />
    </PageInformationsComplementaires>
  );
}

function PageInformationsComplementaires({
  children
}: {
  children: ReactNode;
}) {
  return (
    <Page
      title="Informations complémentaires"
      tagline="Renseignez les informations finales pour votre déclaration"
    >
      {children}
    </Page>
  );
}

export default InformationsComplementaires;
