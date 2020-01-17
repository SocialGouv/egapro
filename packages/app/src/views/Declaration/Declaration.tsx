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

import InfoBloc from "../../components/InfoBloc";
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

  // tous les formulaires ne sont pas encore validés
  if (
    state.informations.formValidated !== "Valid" ||
    state.indicateurUn.formValidated !== "Valid" ||
    (state.indicateurDeux.formValidated !== "Valid" &&
      state.informations.trancheEffectifs !== "50 à 250") ||
    (state.indicateurTrois.formValidated !== "Valid" &&
      state.informations.trancheEffectifs !== "50 à 250") ||
    (state.indicateurDeuxTrois.formValidated !== "Valid" &&
      state.informations.trancheEffectifs === "50 à 250") ||
    state.indicateurQuatre.formValidated !== "Valid" ||
    state.indicateurCinq.formValidated !== "Valid" ||
    state.informationsEntreprise.formValidated !== "Valid" ||
    state.informationsDeclarant.formValidated !== "Valid" ||
    state.informationsComplementaires.formValidated !== "Valid"
  ) {
    return (
      <PageDeclaration>
        <InfoBloc
          title="vous devez renseigner tous les indicateurs ainsi que les informations avant de pouvoir valider"
          text="Vous devez renseigner tous les indicateurs ainsi que les informations avant de pouvoir valider votre déclaration"
        />
      </PageDeclaration>
    );
  }
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
