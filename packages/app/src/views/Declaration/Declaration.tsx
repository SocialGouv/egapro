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
import { TextSimulatorLink } from "../../components/SimulatorLink";

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

  const { noteIndex, totalPoint, totalPointCalculable } = calculNoteIndex(
    trancheEffectifs,
    noteIndicateurUn,
    noteIndicateurDeux,
    noteIndicateurTrois,
    noteIndicateurDeuxTrois,
    noteIndicateurQuatre,
    noteIndicateurCinq
  );

  // tous les formulaires ne sont pas encore validés
  if (
    !allIndicateurValid ||
    state.informationsEntreprise.formValidated !== "Valid" ||
    state.informationsDeclarant.formValidated !== "Valid"
  ) {
    return (
      <PageDeclaration>
        <InfoBloc
          title="vous devez renseigner tous les indicateurs ainsi que les informations relatives à la déclaration avant de pouvoir valider"
          text="Certains des indicateurs et/ou certaines informations relatives à la déclaration sont manquantes"
        />
        <h2>Les formulaires suivants ne sont pas validés</h2>
        <ul>
          {state.indicateurUn.formValidated !== "Valid" &&
            effectifsIndicateurUnCalculable && (
              <li>
                <TextSimulatorLink
                  to="/indicateur1"
                  label="l'indicateur écart de rémunération"
                />
              </li>
            )}
          {trancheEffectifs !== "50 à 250" &&
            state.indicateurDeux.formValidated !== "Valid" &&
            effectifsIndicateurDeuxCalculable && (
              <li>
                <TextSimulatorLink
                  to="/indicateur2"
                  label="l'indicateur écart de de taux d'augmentations"
                />
              </li>
            )}
          {trancheEffectifs !== "50 à 250" &&
            state.indicateurTrois.formValidated !== "Valid" &&
            effectifsIndicateurTroisCalculable && (
              <li>
                <TextSimulatorLink
                  to="/indicateur3"
                  label="l'indicateur écart de de taux de promotions"
                />
              </li>
            )}
          {trancheEffectifs === "50 à 250" &&
            state.indicateurDeuxTrois.formValidated !== "Valid" &&
            effectifsIndicateurDeuxTroisCalculable && (
              <li>
                <TextSimulatorLink
                  to="/indicateur2et3"
                  label="l'indicateur écart de de taux d'augmentations"
                />
              </li>
            )}
          {state.indicateurQuatre.formValidated !== "Valid" && (
            <li>
              <TextSimulatorLink
                to="/indicateur4"
                label="l'indicateur retour de congé maternité"
              />
            </li>
          )}
          {state.indicateurCinq.formValidated !== "Valid" && (
            <li>
              <TextSimulatorLink
                to="/indicateur5"
                label="l'indicateur hautes rémunérations"
              />
            </li>
          )}
          {state.informationsEntreprise.formValidated !== "Valid" && (
            <li>
              <TextSimulatorLink
                to="/informations-entreprise"
                label="les informations entreprise/UES"
              />
            </li>
          )}
          {state.informationsDeclarant.formValidated !== "Valid" && (
            <li>
              <TextSimulatorLink
                to="/informations-declarant"
                label="les informations déclarant"
              />
            </li>
          )}
        </ul>
      </PageDeclaration>
    );
  }

  return (
    <PageDeclaration>
      <LayoutFormAndResult
        childrenForm={
          <Fragment>
            <RecapitulatifIndex
              allIndicateurValid={allIndicateurValid}
              noteIndex={noteIndex}
              totalPoint={totalPoint}
              totalPointCalculable={totalPointCalculable}
            />
            <DeclarationForm
              declaration={state.declaration}
              noteIndex={noteIndex}
              indicateurUnParCSP={state.indicateurUn.csp}
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
      tagline="Une fois toutes les informations relatives à la déclaration fournies dans les différents formulaires, validez votre déclaration"
    >
      {children}
    </Page>
  );
}

export default Declaration;
