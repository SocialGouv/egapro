/** @jsx jsx */
import { jsx } from "@emotion/core";
import { useCallback, ReactNode } from "react";
import { RouteComponentProps } from "react-router-dom";

import {
  AppState,
  FormState,
  ActionType,
  ActionIndicateurQuatreData
} from "../globals.d";

import {
  // calculIndicateurCalculable,
  // calculIndicateurEcartAugmentation,
  calculNote
} from "../utils/calculsEgaProIndicateurQuatre";

import Page from "../components/Page";
import LayoutFormAndResult from "../components/LayoutFormAndResult";
import InfoBloc from "../components/InfoBloc";
import ActionBar from "../components/ActionBar";
import ButtonLink from "../components/ButtonLink";
import ActionLink from "../components/ActionLink";

import IndicateurQuatreForm from "./IndicateurQuatreForm";
import IndicateurQuatreResult from "./IndicateurQuatreResult";

interface Props extends RouteComponentProps {
  state: AppState;
  dispatch: (action: ActionType) => void;
}

function IndicateurQuatre({ state, dispatch }: Props) {
  const updateIndicateurQuatre = useCallback(
    (data: ActionIndicateurQuatreData) =>
      dispatch({ type: "updateIndicateurQuatre", data }),
    [dispatch]
  );

  const validateIndicateurQuatre = useCallback(
    (valid: FormState) => dispatch({ type: "validateIndicateurQuatre", valid }),
    [dispatch]
  );

  // // IC
  // const indicateurCalculable = calculIndicateurCalculable(
  //   state.indicateurQuatre.presenceAugmentation
  // );

  // // IEA
  // const indicateurEcartAugmentation = calculIndicateurEcartAugmentation(
  //   indicateurCalculable,
  //   state.indicateurQuatre.nombreSalariees,
  //   state.indicateurQuatre.nombreSalarieesPeriodeAugmentation
  // );

  // // NOTE
  const noteIndicateurQuatre = calculNote(
    state.indicateurQuatre.toutesSalarieesAugmentees
  );

  //temp
  const indicateurCalculable = true;

  // formulaire indicateur validé mais données renseignées ne permettent pas de calculer l'indicateur
  if (
    state.indicateurQuatre.formValidated === "Valid" &&
    !indicateurCalculable
  ) {
    return (
      <PageIndicateurQuatre>
        <div>
          <InfoBloc
            title="Malheureusement votre indicateur n’est pas calculable"
            text="car il n’y a pas eu de promotion durant la période de référence."
          />
          <ActionBar>
            <ActionLink onClick={() => validateIndicateurQuatre("None")}>
              modifier les données saisies
            </ActionLink>
          </ActionBar>
          <ActionBar>
            <ButtonLink to="/indicateur4" label="suivant" />
          </ActionBar>
        </div>
      </PageIndicateurQuatre>
    );
  }

  return (
    <PageIndicateurQuatre>
      <LayoutFormAndResult
        childrenForm={
          <IndicateurQuatreForm
            indicateurQuatre={state.indicateurQuatre}
            readOnly={state.indicateurQuatre.formValidated === "Valid"}
            updateIndicateurQuatre={updateIndicateurQuatre}
            validateIndicateurQuatre={validateIndicateurQuatre}
          />
        }
        childrenResult={
          state.indicateurQuatre.formValidated === "Valid" && (
            <IndicateurQuatreResult
              indicateurEcartAugmentation={undefined}
              noteIndicateurQuatre={noteIndicateurQuatre}
              validateIndicateurQuatre={validateIndicateurQuatre}
            />
          )
        }
      />
    </PageIndicateurQuatre>
  );
}

function PageIndicateurQuatre({ children }: { children: ReactNode }) {
  return (
    <Page
      title="Indicateur 4, pourcentage de salariées augmentées dans l'année suivant leur retour de congé maternité"
      tagline="Renseignez le taux de salariées en congès maternité durant la période de référence ayant reçu une augmentation à leur retour."
    >
      {children}
    </Page>
  );
}

export default IndicateurQuatre;
