/** @jsx jsx */
import { jsx } from "@emotion/core";
import { useCallback, ReactNode } from "react";
import { RouteComponentProps } from "react-router-dom";

import {
  AppState,
  FormState,
  ActionType,
  ActionInformationsData
} from "../../globals";

import Page from "../../components/Page";
import LayoutFormAndResult from "../../components/LayoutFormAndResult";

import InformationsForm from "./InformationsForm";
import InformationsResult from "./InformationsResult";

interface Props extends RouteComponentProps {
  state: AppState;
  dispatch: (action: ActionType) => void;
}

function Informations({ state, dispatch }: Props) {
  const updateInformations = useCallback(
    (data: ActionInformationsData) =>
      dispatch({ type: "updateInformations", data }),
    [dispatch]
  );

  const validateInformations = useCallback(
    (valid: FormState) => dispatch({ type: "validateInformations", valid }),
    [dispatch]
  );

  return (
    <PageInformations>
      <LayoutFormAndResult
        childrenForm={
          <InformationsForm
            informations={state.informations}
            readOnly={state.informations.formValidated === "Valid"}
            updateInformations={updateInformations}
            validateInformations={validateInformations}
          />
        }
        childrenResult={
          state.informations.formValidated === "Valid" && (
            <InformationsResult
              nomEntreprise={state.informations.nomEntreprise}
              trancheEffectifs={state.informations.trancheEffectifs}
              debutPeriodeReference={state.informations.debutPeriodeReference}
              validateInformations={validateInformations}
            />
          )
        }
      />
    </PageInformations>
  );
}

function PageInformations({ children }: { children: ReactNode }) {
  return (
    <Page
      title="Information société et période de référence"
      tagline="Renseignez le nom et la tranche d'effectifs de votre enteprise, ainsi que la période de référence."
    >
      {children}
    </Page>
  );
}

export default Informations;
