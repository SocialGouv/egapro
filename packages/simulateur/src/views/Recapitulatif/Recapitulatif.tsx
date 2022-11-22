import React, { FunctionComponent } from "react"
import { Box, VStack, Text, Tooltip, Button } from "@chakra-ui/react"
import { RouteComponentProps } from "react-router-dom"

import { AppState } from "../../globals"

import { useTitle } from "../../utils/hooks"

import calculIndicateurUn from "../../utils/calculsEgaProIndicateurUn"
import calculIndicateurDeux from "../../utils/calculsEgaProIndicateurDeux"
import calculIndicateurTrois from "../../utils/calculsEgaProIndicateurTrois"
import calculIndicateurDeuxTrois from "../../utils/calculsEgaProIndicateurDeuxTrois"
import calculIndicateurQuatre from "../../utils/calculsEgaProIndicateurQuatre"
import calculIndicateurCinq from "../../utils/calculsEgaProIndicateurCinq"
import { calculNoteIndex } from "../../utils/calculsEgaProIndex"
import totalNombreSalaries from "../../utils/totalNombreSalaries"

import Page from "../../components/Page"
import ActionBar from "../../components/ActionBar"
import { ButtonSimulatorLink } from "../../components/SimulatorLink"

import RecapitulatifIndex from "./RecapitulatifIndex"
import RecapitulatifInformations from "./RecapitulatifInformations"
import RecapitulatifIndicateurUn from "./RecapitulatifIndicateurUn"
import RecapitulatifIndicateurDeux from "./RecapitulatifIndicateurDeux"
import RecapitulatifIndicateurTrois from "./RecapitulatifIndicateurTrois"
import RecapitulatifIndicateurDeuxTrois from "./RecapitulatifIndicateurDeuxTrois"
import RecapitulatifIndicateurQuatre from "./RecapitulatifIndicateurQuatre"
import RecapitulatifIndicateurCinq from "./RecapitulatifIndicateurCinq"

interface RecapitulatifProps extends RouteComponentProps {
  state: AppState
}

const title = "Récapitulatif"

const Recapitulatif: FunctionComponent<RecapitulatifProps> = ({ state }) => {
  useTitle(title)

  const trancheEffectifs = state.informations.trancheEffectifs

  const periodeSuffisante = state.informations.periodeSuffisante as boolean

  const {
    effectifsIndicateurCalculable: effectifsIndicateurUnCalculable,
    effectifEtEcartRemuParTranche,
    indicateurEcartRemuneration,
    indicateurSexeSurRepresente: indicateurUnSexeSurRepresente,
    noteIndicateurUn,
  } = calculIndicateurUn(state)

  const {
    effectifsIndicateurCalculable: effectifsIndicateurDeuxCalculable,
    indicateurCalculable: indicateurDeuxCalculable,
    effectifEtEcartAugmentParGroupe,
    indicateurEcartAugmentation,
    indicateurSexeSurRepresente: indicateurDeuxSexeSurRepresente,
    noteIndicateurDeux,
    correctionMeasure: correctionMeasureIndicateurDeux,
  } = calculIndicateurDeux(state)

  const {
    effectifsIndicateurCalculable: effectifsIndicateurTroisCalculable,
    indicateurCalculable: indicateurTroisCalculable,
    effectifEtEcartPromoParGroupe,
    indicateurEcartPromotion,
    indicateurSexeSurRepresente: indicateurTroisSexeSurRepresente,
    noteIndicateurTrois,
    correctionMeasure: correctionMeasureIndicateurTrois,
  } = calculIndicateurTrois(state)

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
    plusPetitNombreSalaries,
  } = calculIndicateurDeuxTrois(state)

  const {
    indicateurCalculable: indicateurQuatreCalculable,
    indicateurEcartNombreSalarieesAugmentees,
    noteIndicateurQuatre,
  } = calculIndicateurQuatre(state)

  const {
    indicateurSexeSousRepresente: indicateurCinqSexeSousRepresente,
    indicateurNombreSalariesSexeSousRepresente,
    noteIndicateurCinq,
  } = calculIndicateurCinq(state)

  const allIndicateurValid =
    (state.indicateurUn.formValidated === "Valid" ||
      // Si l'indicateurUn n'est pas calculable par coefficient, forcer le calcul par CSP
      (!effectifsIndicateurUnCalculable && state.indicateurUn.csp)) &&
    (trancheEffectifs !== "50 à 250"
      ? (state.indicateurDeux.formValidated === "Valid" || !effectifsIndicateurDeuxCalculable) &&
        (state.indicateurTrois.formValidated === "Valid" || !effectifsIndicateurTroisCalculable)
      : state.indicateurDeuxTrois.formValidated === "Valid" || !effectifsIndicateurDeuxTroisCalculable) &&
    state.indicateurQuatre.formValidated === "Valid" &&
    state.indicateurCinq.formValidated === "Valid"

  const { noteIndex, totalPoint, totalPointCalculable } = calculNoteIndex(
    trancheEffectifs,
    noteIndicateurUn,
    noteIndicateurDeux,
    noteIndicateurTrois,
    noteIndicateurDeuxTrois,
    noteIndicateurQuatre,
    noteIndicateurCinq,
  )

  const { totalNombreSalariesHomme, totalNombreSalariesFemme } = totalNombreSalaries(state.effectif.nombreSalaries)

  return (
    <Page title="Récapitulatif des résultats de vos indicateurs">
      <VStack spacing={6} align="stretch">
        <RecapitulatifInformations
          informationsFormValidated={state.informations.formValidated}
          trancheEffectifs={state.informations.trancheEffectifs}
          anneeDeclaration={state.informations.anneeDeclaration}
          finPeriodeReference={state.informations.finPeriodeReference}
          nombreSalaries={totalNombreSalariesHomme + totalNombreSalariesFemme}
          periodeSuffisante={periodeSuffisante}
        />
        {periodeSuffisante && (
          <>
            <RecapitulatifIndex
              allIndicateurValid={allIndicateurValid}
              noteIndex={noteIndex}
              totalPoint={totalPoint}
              totalPointCalculable={totalPointCalculable}
            />
            <RecapitulatifIndicateurUn
              indicateurUnFormValidated={state.indicateurUn.formValidated}
              effectifsIndicateurUnCalculable={effectifsIndicateurUnCalculable}
              effectifEtEcartRemuParTranche={effectifEtEcartRemuParTranche}
              indicateurEcartRemuneration={indicateurEcartRemuneration}
              indicateurSexeSurRepresente={indicateurUnSexeSurRepresente}
              indicateurUnParCSP={state.indicateurUn.csp}
              noteIndicateurUn={noteIndicateurUn}
            />
            {(trancheEffectifs !== "50 à 250" && (
              <>
                <RecapitulatifIndicateurDeux
                  indicateurDeuxFormValidated={state.indicateurDeux.formValidated}
                  effectifsIndicateurDeuxCalculable={effectifsIndicateurDeuxCalculable}
                  indicateurDeuxCalculable={indicateurDeuxCalculable}
                  effectifEtEcartAugmentParGroupe={effectifEtEcartAugmentParGroupe}
                  indicateurEcartAugmentation={indicateurEcartAugmentation}
                  indicateurSexeSurRepresente={indicateurDeuxSexeSurRepresente}
                  noteIndicateurDeux={noteIndicateurDeux}
                  correctionMeasure={correctionMeasureIndicateurDeux}
                />
                <RecapitulatifIndicateurTrois
                  indicateurTroisFormValidated={state.indicateurTrois.formValidated}
                  effectifsIndicateurTroisCalculable={effectifsIndicateurTroisCalculable}
                  indicateurTroisCalculable={indicateurTroisCalculable}
                  effectifEtEcartPromoParGroupe={effectifEtEcartPromoParGroupe}
                  indicateurEcartPromotion={indicateurEcartPromotion}
                  indicateurSexeSurRepresente={indicateurTroisSexeSurRepresente}
                  noteIndicateurTrois={noteIndicateurTrois}
                  correctionMeasure={correctionMeasureIndicateurTrois}
                />
              </>
            )) || (
              <RecapitulatifIndicateurDeuxTrois
                indicateurDeuxTroisFormValidated={state.indicateurDeuxTrois.formValidated}
                effectifsIndicateurDeuxTroisCalculable={effectifsIndicateurDeuxTroisCalculable}
                indicateurDeuxTroisCalculable={indicateurDeuxTroisCalculable}
                indicateurEcartAugmentationPromotion={indicateurEcartAugmentationPromotion}
                indicateurEcartNombreEquivalentSalaries={indicateurEcartNombreEquivalentSalaries}
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
              indicateurEcartNombreSalarieesAugmentees={indicateurEcartNombreSalarieesAugmentees}
              presenceCongeMat={state.indicateurQuatre.presenceCongeMat}
              nombreSalarieesPeriodeAugmentation={state.indicateurQuatre.nombreSalarieesPeriodeAugmentation}
              noteIndicateurQuatre={noteIndicateurQuatre}
            />
            <RecapitulatifIndicateurCinq
              indicateurCinqFormValidated={state.indicateurCinq.formValidated}
              indicateurSexeSousRepresente={indicateurCinqSexeSousRepresente}
              indicateurNombreSalariesSexeSousRepresente={indicateurNombreSalariesSexeSousRepresente}
              noteIndicateurCinq={noteIndicateurCinq}
            />
          </>
        )}
      </VStack>
      <Box
        mt={6}
        sx={{
          "@media print": {
            display: "none",
          },
        }}
      >
        <Text>
          La simulation est terminée. Vous pouvez si vous le souhaitez déclarer ces indicateurs en renseignant d'autres
          informations. Il vous sera demandé un email valide pour pouvoir poursuivre.
        </Text>

        <ActionBar>
          <ButtonSimulatorLink to="/informations-entreprise" label="Poursuivre vers la déclaration" />
          <Box>
            <Tooltip
              label="Possible d'enregistrer en PDF depuis la fenêtre d'impression"
              hasArrow
              sx={{
                "@media print": {
                  display: "none",
                },
              }}
            >
              <Button size="lg" variant="outline" onClick={() => window.print()}>
                Imprimer
              </Button>
            </Tooltip>
          </Box>
        </ActionBar>
      </Box>
    </Page>
  )
}

export default Recapitulatif
