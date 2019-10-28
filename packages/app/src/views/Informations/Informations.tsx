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

import InfoBloc from "../../components/InfoBloc";
import Page from "../../components/Page";
import LayoutFormAndResult from "../../components/LayoutFormAndResult";

import InformationsForm from "./InformationsForm";

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
        childrenResult={null}
      />

      {state.informations.formValidated === "Valid" &&
        (state.effectif.formValidated === "Invalid" ||
          state.indicateurUn.formValidated === "Invalid" ||
          state.indicateurDeux.formValidated === "Invalid" ||
          state.indicateurTrois.formValidated === "Invalid" ||
          state.indicateurDeuxTrois.formValidated === "Invalid" ||
          state.indicateurQuatre.formValidated === "Invalid" ||
          state.indicateurCinq.formValidated === "Invalid") && (
          <InfoBloc
            title="Vos informations ont été modifiées"
            icon="cross"
            text={
              <span>
                afin de s'assurer de la cohérence de votre index, merci de
                vérifier les données de vos indicateurs.
              </span>
            }
          />
        )}
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
