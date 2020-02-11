/** @jsx jsx */
import { jsx } from "@emotion/core";
import { useCallback, ReactNode } from "react";
import { RouteComponentProps } from "react-router-dom";

import {
  AppState,
  FormState,
  ActionType,
  ActionInformationsEntrepriseData
} from "../../globals";

import Page from "../../components/Page";
import LayoutFormAndResult from "../../components/LayoutFormAndResult";

import InformationsEntrepriseForm from "./InformationsEntrepriseForm";

interface Props extends RouteComponentProps {
  state: AppState;
  dispatch: (action: ActionType) => void;
}

function InformationsEntreprise({ state, dispatch }: Props) {
  const updateInformationsEntreprise = useCallback(
    (data: ActionInformationsEntrepriseData) =>
      dispatch({ type: "updateInformationsEntreprise", data }),
    [dispatch]
  );

  const validateInformationsEntreprise = useCallback(
    (valid: FormState) =>
      dispatch({ type: "validateInformationsEntreprise", valid }),
    [dispatch]
  );

  return (
    <PageInformationsEntreprise>
      <LayoutFormAndResult
        childrenForm={
          <InformationsEntrepriseForm
            informationsEntreprise={state.informationsEntreprise}
            readOnly={state.informationsEntreprise.formValidated === "Valid"}
            updateInformationsEntreprise={updateInformationsEntreprise}
            validateInformationsEntreprise={validateInformationsEntreprise}
          />
        }
        childrenResult={null}
      />
    </PageInformationsEntreprise>
  );
}

function PageInformationsEntreprise({ children }: { children: ReactNode }) {
  return (
    <Page
      title="Informations entreprise/UES"
      tagline="Renseignez le nom de votre entreprise ou UES, ainsi que les informations de Siren, code Naf et adresse"
    >
      {children}
    </Page>
  );
}

export default InformationsEntreprise;
