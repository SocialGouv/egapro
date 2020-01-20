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

import InfoBloc from "../../components/InfoBloc";
import Page from "../../components/Page";
import LayoutFormAndResult from "../../components/LayoutFormAndResult";
import { TextSimulatorLink } from "../../components/SimulatorLink";

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
  if (state.indicateurUn.formValidated !== "Valid") {
    return (
      <PageInformationsComplementaires>
        <InfoBloc
          title="vous devez renseigner l'indicateur écart de rémunérations avant de pouvoir renseigner ces informations"
          text={
            <TextSimulatorLink
              to="/indicateur1"
              label="renseigner les informations"
            />
          }
        />
      </PageInformationsComplementaires>
    );
  }

  return (
    <PageInformationsComplementaires>
      <LayoutFormAndResult
        childrenForm={
          <InformationsComplementairesForm
            informationsComplementaires={state.informationsComplementaires}
            indicateurUnParCSP={state.indicateurUn.csp}
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
