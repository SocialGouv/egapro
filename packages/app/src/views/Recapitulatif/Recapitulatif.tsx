/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { RouteComponentProps } from "react-router-dom";

import { AppState } from "../../globals.d";

import calculIndicateurUn from "../../utils/calculsEgaProIndicateurUn";
import calculIndicateurDeux from "../../utils/calculsEgaProIndicateurDeux";
import calculIndicateurTrois from "../../utils/calculsEgaProIndicateurTrois";
import calculIndicateurDeuxTrois from "../../utils/calculsEgaProIndicateurDeuxTrois";
import calculIndicateurQuatre from "../../utils/calculsEgaProIndicateurQuatre";
import calculIndicateurCinq from "../../utils/calculsEgaProIndicateurCinq";
import { calculNoteIndex } from "../../utils/calculsEgaProIndex";
import totalNombreSalaries from "../../utils/totalNombreSalaries";

import Page from "../../components/Page";
import ActionBar from "../../components/ActionBar";
import ButtonAction from "../../components/ButtonAction";

import RecapitulatifIndex from "./RecapitulatifIndex";
import RecapitulatifInformations from "./RecapitulatifInformations";
import RecapitulatifIndicateurUn from "./RecapitulatifIndicateurUn";
import RecapitulatifIndicateurDeux from "./RecapitulatifIndicateurDeux";
import RecapitulatifIndicateurTrois from "./RecapitulatifIndicateurTrois";
import RecapitulatifIndicateurDeuxTrois from "./RecapitulatifIndicateurDeuxTrois";
import RecapitulatifIndicateurQuatre from "./RecapitulatifIndicateurQuatre";
import RecapitulatifIndicateurCinq from "./RecapitulatifIndicateurCinq";
import { Fragment } from "react";

interface Props extends RouteComponentProps {
  state: AppState;
}

function Recapitulatif({ state }: Props) {
  const trancheEffectifs = state.informations.trancheEffectifs;

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
    noteIndicateurDeux,
    correctionMeasure: correctionMeasureIndicateurDeux
  } = calculIndicateurDeux(state);

  const {
    effectifsIndicateurCalculable: effectifsIndicateurTroisCalculable,
    indicateurCalculable: indicateurTroisCalculable,
    effectifEtEcartPromoParGroupe,
    indicateurEcartPromotion,
    indicateurSexeSurRepresente: indicateurTroisSexeSurRepresente,
    noteIndicateurTrois,
    correctionMeasure: correctionMeasureIndicateurTrois
  } = calculIndicateurTrois(state);

  const {
    effectifsIndicateurCalculable: effectifsIndicateurDeuxTroisCalculable,
    indicateurCalculable: indicateurDeuxTroisCalculable,
    indicateurEcartAugmentationPromotion,
    indicateurEcartNombreEquivalentSalaries,
    indicateurSexeSurRepresente: indicateurDeuxTroisSexeSurRepresente,
    noteIndicateurDeuxTrois,
    correctionMeasure: correctionMeasureIndicateurDeuxTrois,
    tauxAugmentationPromotionHommes,
    tauxAugmentationPromotionFemmes,
    plusPetitNombreSalaries
  } = calculIndicateurDeuxTrois(state);

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
    (trancheEffectifs !== "50 à 249"
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

  const {
    totalNombreSalariesHomme,
    totalNombreSalariesFemme
  } = totalNombreSalaries(state.effectif.nombreSalaries);

  return (
    <Page title="Récapitulatif des résultats de vos indicateurs">
      <RecapitulatifInformations
        informationsFormValidated={state.informations.formValidated}
        trancheEffectifs={state.informations.trancheEffectifs}
        debutPeriodeReference={state.informations.debutPeriodeReference}
        finPeriodeReference={state.informations.finPeriodeReference}
        nombreSalaries={totalNombreSalariesHomme + totalNombreSalariesFemme}
      />
      <RecapitulatifIndex
        allIndicateurValid={allIndicateurValid}
        noteIndex={noteIndex}
        totalPointCalculable={totalPointCalculable}
      />
      <RecapitulatifIndicateurUn
        indicateurUnFormValidated={state.indicateurUn.formValidated}
        effectifsIndicateurUnCalculable={effectifsIndicateurUnCalculable}
        effectifEtEcartRemuParTranche={effectifEtEcartRemuParTranche}
        indicateurEcartRemuneration={indicateurEcartRemuneration}
        indicateurSexeSurRepresente={indicateurUnSexeSurRepresente}
        noteIndicateurUn={noteIndicateurUn}
      />
      {(trancheEffectifs !== "50 à 249" && (
        <Fragment>
          <RecapitulatifIndicateurDeux
            indicateurDeuxFormValidated={state.indicateurDeux.formValidated}
            effectifsIndicateurDeuxCalculable={
              effectifsIndicateurDeuxCalculable
            }
            indicateurDeuxCalculable={indicateurDeuxCalculable}
            effectifEtEcartAugmentParGroupe={effectifEtEcartAugmentParGroupe}
            indicateurEcartAugmentation={indicateurEcartAugmentation}
            indicateurSexeSurRepresente={indicateurDeuxSexeSurRepresente}
            noteIndicateurDeux={noteIndicateurDeux}
            correctionMeasure={correctionMeasureIndicateurDeux}
          />
          <RecapitulatifIndicateurTrois
            indicateurTroisFormValidated={state.indicateurTrois.formValidated}
            effectifsIndicateurTroisCalculable={
              effectifsIndicateurTroisCalculable
            }
            indicateurTroisCalculable={indicateurTroisCalculable}
            effectifEtEcartPromoParGroupe={effectifEtEcartPromoParGroupe}
            indicateurEcartPromotion={indicateurEcartPromotion}
            indicateurSexeSurRepresente={indicateurTroisSexeSurRepresente}
            noteIndicateurTrois={noteIndicateurTrois}
            correctionMeasure={correctionMeasureIndicateurTrois}
          />
        </Fragment>
      )) || (
        <RecapitulatifIndicateurDeuxTrois
          indicateurDeuxTroisFormValidated={
            state.indicateurDeuxTrois.formValidated
          }
          effectifsIndicateurDeuxTroisCalculable={
            effectifsIndicateurDeuxTroisCalculable
          }
          indicateurDeuxTroisCalculable={indicateurDeuxTroisCalculable}
          indicateurEcartAugmentationPromotion={
            indicateurEcartAugmentationPromotion
          }
          indicateurEcartNombreEquivalentSalaries={
            indicateurEcartNombreEquivalentSalaries
          }
          indicateurSexeSurRepresente={indicateurDeuxTroisSexeSurRepresente}
          noteIndicateurDeuxTrois={noteIndicateurDeuxTrois}
          correctionMeasure={correctionMeasureIndicateurDeuxTrois}
          tauxAugmentationPromotionHommes={tauxAugmentationPromotionHommes}
          tauxAugmentationPromotionFemmes={tauxAugmentationPromotionFemmes}
          plusPetitNombreSalaries={plusPetitNombreSalaries}
        />
      )}
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
      <ActionBar>
        <ButtonAction
          label="imprimer"
          outline={true}
          onClick={() => window.print()}
        />
        <span css={styles.info}>
          (possible d'enregistrer en PDF depuis la fenêtre d'impression)
        </span>
      </ActionBar>
    </Page>
  );
}

const styles = {
  info: css({
    marginLeft: 4,
    fontSize: 12
  })
};

export default Recapitulatif;
