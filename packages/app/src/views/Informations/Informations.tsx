/** @jsx jsx */
import { jsx } from "@emotion/core";
import { useCallback, Fragment, ReactNode } from "react";
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
import { TextSimulatorLink } from "../../components/SimulatorLink";

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
              finPeriodeReference={state.informations.finPeriodeReference}
              validateInformations={validateInformations}
            />
          )
        }
      />

      {state.informations.formValidated === "Valid" &&
        (state.informations.trancheEffectifs !== "50 à 250"
          ? state.indicateurDeux.formValidated === "Invalid" ||
            state.indicateurTrois.formValidated === "Invalid"
          : state.indicateurDeuxTrois.formValidated === "Invalid") && (
          <InfoBloc
            title="Vos informations ont été modifiés"
            icon="cross"
            text={
              <Fragment>
                <span>
                  afin de s'assurer de la cohérence de votre index, merci de
                  vérifier les données de vos indicateurs.
                </span>
                &emsp;
                <span>
                  {state.informations.trancheEffectifs !== "50 à 250" &&
                    state.indicateurDeux.formValidated === "Invalid" && (
                      <Fragment>
                        <TextSimulatorLink
                          to="/indicateur2"
                          label="aller à l'indicateur écart de taux d'augmentations"
                        />
                        &emsp;
                      </Fragment>
                    )}
                  {state.informations.trancheEffectifs !== "50 à 250" &&
                    state.indicateurTrois.formValidated === "Invalid" && (
                      <Fragment>
                        <TextSimulatorLink
                          to="/indicateur3"
                          label="aller à l'indicateur écart de taux de promotions"
                        />
                        &emsp;
                      </Fragment>
                    )}
                  {state.informations.trancheEffectifs === "50 à 250" &&
                    state.indicateurDeuxTrois.formValidated === "Invalid" && (
                      <TextSimulatorLink
                        to="/indicateur2et3"
                        label="aller à l'indicateur écart de taux d'augmentations"
                      />
                    )}
                </span>
              </Fragment>
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
