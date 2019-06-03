/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { RouteComponentProps } from "react-router-dom";

import { AppState } from "../../globals.d";

import calculIndicateurUn from "../../utils/calculsEgaProIndicateurUn";
import calculIndicateurDeux from "../../utils/calculsEgaProIndicateurDeux";
import calculIndicateurTrois from "../../utils/calculsEgaProIndicateurTrois";
import calculIndicateurQuatre from "../../utils/calculsEgaProIndicateurQuatre";
import calculIndicateurCinq from "../../utils/calculsEgaProIndicateurCinq";
import { calculNoteIndex } from "../../utils/calculsEgaProIndex";

import InfoBloc from "../../components/InfoBloc";
import Page from "../../components/Page";

import RecapitulatifIndicateurUn from "./RecapitulatifIndicateurUn";
import RecapitulatifIndicateurDeux from "./RecapitulatifIndicateurDeux";
import RecapitulatifIndicateurTrois from "./RecapitulatifIndicateurTrois";
import RecapitulatifIndicateurQuatre from "./RecapitulatifIndicateurQuatre";
import RecapitulatifIndicateurCinq from "./RecapitulatifIndicateurCinq";

interface Props extends RouteComponentProps {
  state: AppState;
}

function Recapitulatif({ state }: Props) {
  const {
    effectifsIndicateurCalculable: effectifsIndicateurUnCalculable,
    effectifEtEcartRemuParTranche,
    indicateurEcartRemuneration,
    indicateurSexeSurRepresente: indicateurUnSexeSurRepresente,
    noteIndicateurUn
  } = calculIndicateurUn(state);

  const {
    effectifsIndicateurCalculable: effectifsIndicateurDeuxCalculable,
    indicateurCalculable: indicateurDeuxCalculable,
    effectifEtEcartAugmentParGroupe,
    indicateurEcartAugmentation,
    indicateurSexeSurRepresente: indicateurDeuxSexeSurRepresente,
    noteIndicateurDeux
  } = calculIndicateurDeux(state);

  const {
    effectifsIndicateurCalculable: effectifsIndicateurTroisCalculable,
    indicateurCalculable: indicateurTroisCalculable,
    effectifEtEcartPromoParGroupe,
    indicateurEcartPromotion,
    indicateurSexeSurRepresente: indicateurTroisSexeSurRepresente,
    noteIndicateurTrois
  } = calculIndicateurTrois(state);

  const {
    indicateurCalculable: indicateurQuatreCalculable,
    indicateurEcartNombreSalarieesAugmentees,
    noteIndicateurQuatre
  } = calculIndicateurQuatre(state);

  const {
    indicateurSexeSousRepresente: indicateurCinqSexeSousRepresente,
    indicateurNombreSalariesSexeSousRepresente,
    noteIndicateurCinq
  } = calculIndicateurCinq(state);

  const allIndicateurValid =
    (state.indicateurUn.formValidated === "Valid" ||
      !effectifsIndicateurUnCalculable) &&
    (state.indicateurDeux.formValidated === "Valid" ||
      !effectifsIndicateurDeuxCalculable) &&
    (state.indicateurTrois.formValidated === "Valid" ||
      !effectifsIndicateurTroisCalculable) &&
    state.indicateurQuatre.formValidated === "Valid" &&
    state.indicateurCinq.formValidated === "Valid";

  const noteIndex = calculNoteIndex(
    noteIndicateurUn,
    noteIndicateurDeux,
    noteIndicateurTrois,
    noteIndicateurQuatre,
    noteIndicateurCinq
  );

  return (
    <Page
      title="Récapitulatif des résultats de vos indicateurs"
      tagline="Oubliez pas de décalarer vos résultats sur SOLEN avant le 1er septembre."
    >
      <div css={styles.indexBloc}>
        {allIndicateurValid ? (
          noteIndex ? (
            <InfoBloc
              title="Index égalité homme-femme"
              text={`votre résultat total est ${noteIndex}/100`}
              icon={null}
            />
          ) : (
            <InfoBloc
              title="Index égalité homme-femme"
              text="Vos indicateurs représentent moins de 75 points, votre index ne peut-être calculé."
            />
          )
        ) : (
          <InfoBloc
            title="Index égalité homme-femme"
            text="Vous n’avez pas encore validé tous vos indicateur, votre index ne peut-être calculé."
          />
        )}
      </div>
      <RecapitulatifIndicateurUn
        indicateurUnFormValidated={state.indicateurUn.formValidated}
        effectifsIndicateurUnCalculable={effectifsIndicateurUnCalculable}
        effectifEtEcartRemuParTranche={effectifEtEcartRemuParTranche}
        indicateurEcartRemuneration={indicateurEcartRemuneration}
        indicateurSexeSurRepresente={indicateurUnSexeSurRepresente}
        noteIndicateurUn={noteIndicateurUn}
      />
      <RecapitulatifIndicateurDeux
        indicateurDeuxFormValidated={state.indicateurDeux.formValidated}
        effectifsIndicateurDeuxCalculable={effectifsIndicateurDeuxCalculable}
        indicateurDeuxCalculable={indicateurDeuxCalculable}
        effectifEtEcartAugmentParGroupe={effectifEtEcartAugmentParGroupe}
        indicateurEcartAugmentation={indicateurEcartAugmentation}
        indicateurSexeSurRepresente={indicateurDeuxSexeSurRepresente}
        noteIndicateurDeux={noteIndicateurDeux}
      />
      <RecapitulatifIndicateurTrois
        indicateurTroisFormValidated={state.indicateurTrois.formValidated}
        effectifsIndicateurTroisCalculable={effectifsIndicateurTroisCalculable}
        indicateurTroisCalculable={indicateurTroisCalculable}
        effectifEtEcartPromoParGroupe={effectifEtEcartPromoParGroupe}
        indicateurEcartPromotion={indicateurEcartPromotion}
        indicateurSexeSurRepresente={indicateurTroisSexeSurRepresente}
        noteIndicateurTrois={noteIndicateurTrois}
      />
      <RecapitulatifIndicateurQuatre
        indicateurQuatreFormValidated={state.indicateurQuatre.formValidated}
        indicateurQuatreCalculable={indicateurQuatreCalculable}
        indicateurEcartNombreSalarieesAugmentees={
          indicateurEcartNombreSalarieesAugmentees
        }
        noteIndicateurQuatre={noteIndicateurQuatre}
      />
      <RecapitulatifIndicateurCinq
        indicateurCinqFormValidated={state.indicateurCinq.formValidated}
        indicateurSexeSousRepresente={indicateurCinqSexeSousRepresente}
        indicateurNombreSalariesSexeSousRepresente={
          indicateurNombreSalariesSexeSousRepresente
        }
        noteIndicateurCinq={noteIndicateurCinq}
      />
    </Page>
  );
}

const styles = {
  indexBloc: css({
    marginTop: 22,
    marginBottom: 22
  })
};

export default Recapitulatif;
