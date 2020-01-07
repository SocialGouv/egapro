/** @jsx jsx */
import { jsx } from "@emotion/core";
import { useCallback, ReactNode } from "react";
import { RouteComponentProps } from "react-router-dom";

import {
  AppState,
  FormState,
  ActionType,
  ActionDeclarationData
} from "../../globals";

import Page from "../../components/Page";
import LayoutFormAndResult from "../../components/LayoutFormAndResult";

import DeclarationForm from "./DeclarationForm";

interface Props extends RouteComponentProps {
  state: AppState;
  dispatch: (action: ActionType) => void;
}

function Declaration({ state, dispatch }: Props) {
  const updateDeclaration = useCallback(
    (data: ActionDeclarationData) =>
      dispatch({ type: "updateDeclaration", data }),
    [dispatch]
  );

  const validateDeclaration = useCallback(
    (valid: FormState) => dispatch({ type: "validateDeclaration", valid }),
    [dispatch]
  );

  return (
    <PageDeclaration>
      <LayoutFormAndResult
        childrenForm={
          <DeclarationForm
            declaration={state.declaration}
            readOnly={state.declaration.formValidated === "Valid"}
            updateDeclaration={updateDeclaration}
            validateDeclaration={validateDeclaration}
          />
        }
        childrenResult={null}
      />
    </PageDeclaration>
  );
}

function PageDeclaration({ children }: { children: ReactNode }) {
  return (
    <Page
      title="Déclaration"
      tagline="Une fois toutes les informations fournies dans les différents formulaires, validez votre déclaration"
    >
      {children}
    </Page>
  );
}

export default Declaration;
