/** @jsx jsx */
import { jsx } from "@emotion/core";
import { useCallback, Fragment, ReactNode } from "react";
import { RouteComponentProps } from "react-router-dom";

import {
  AppState,
  FormState,
  ActionType,
  ActionDeclarationData
} from "../../globals";

import calculIndicateurUn from "../../utils/calculsEgaProIndicateurUn";
import calculIndicateurDeux from "../../utils/calculsEgaProIndicateurDeux";
import calculIndicateurTrois from "../../utils/calculsEgaProIndicateurTrois";
import calculIndicateurDeuxTrois from "../../utils/calculsEgaProIndicateurDeuxTrois";
import calculIndicateurQuatre from "../../utils/calculsEgaProIndicateurQuatre";
import calculIndicateurCinq from "../../utils/calculsEgaProIndicateurCinq";
import { calculNoteIndex } from "../../utils/calculsEgaProIndex";

import InfoBloc from "../../components/InfoBloc";
import Page from "../../components/Page";
import LayoutFormAndResult from "../../components/LayoutFormAndResult";

import DeclarationForm from "./DeclarationForm";
import RecapitulatifIndex from "../Recapitulatif/RecapitulatifIndex";

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

  const {
    effectifsIndicateurCalculable: effectifsIndicateurUnCalculable,
    noteIndicateurUn
  } = calculIndicateurUn(state);

  const {
    effectifsIndicateurCalculable: effectifsIndicateurDeuxCalculable,
    noteIndicateurDeux
  } = calculIndicateurDeux(state);

  const {
    effectifsIndicateurCalculable: effectifsIndicateurTroisCalculable,
    noteIndicateurTrois
  } = calculIndicateurTrois(state);

  const {
    effectifsIndicateurCalculable: effectifsIndicateurDeuxTroisCalculable,
    noteIndicateurDeuxTrois
  } = calculIndicateurDeuxTrois(state);

  const { noteIndicateurQuatre } = calculIndicateurQuatre(state);

  const { noteIndicateurCinq } = calculIndicateurCinq(state);

  const trancheEffectifs = state.informations.trancheEffectifs;

  const allIndicateurValid =
    (state.indicateurUn.formValidated === "Valid" ||
      !effectifsIndicateurUnCalculable) &&
    (trancheEffectifs !== "50 à 250"
      ? (state.indicateurDeux.formValidated === "Valid" ||
          !effectifsIndicateurDeuxCalculable) &&
        (state.indicateurTrois.formValidated === "Valid" ||
          !effectifsIndicateurTroisCalculable)
      : state.indicateurDeuxTrois.formValidated === "Valid" ||
        !effectifsIndicateurDeuxTroisCalculable) &&
    state.indicateurQuatre.formValidated === "Valid" &&
    state.indicateurCinq.formValidated === "Valid";

  const { noteIndex, totalPointCalculable } = calculNoteIndex(
    trancheEffectifs,
    noteIndicateurUn,
    noteIndicateurDeux,
    noteIndicateurTrois,
    noteIndicateurDeuxTrois,
    noteIndicateurQuatre,
    noteIndicateurCinq
  );
  return (
    <PageDeclaration>
      <LayoutFormAndResult
        childrenForm={
          <Fragment>
            <RecapitulatifIndex
              allIndicateurValid={allIndicateurValid}
              noteIndex={noteIndex}
              totalPointCalculable={totalPointCalculable}
            />
            <DeclarationForm
              declaration={state.declaration}
              readOnly={state.declaration.formValidated === "Valid"}
              updateDeclaration={updateDeclaration}
              validateDeclaration={validateDeclaration}
            />
          </Fragment>
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
