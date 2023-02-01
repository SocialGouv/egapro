import React, { FunctionComponent } from "react"
import { Box, VStack, Text, Tooltip, Button } from "@chakra-ui/react"
import { RouteComponentProps } from "react-router-dom"

import { AppState } from "../../globals"

import { useTitle } from "../../utils/hooks"

import calculIndicateurUn from "../../utils/calculsEgaProIndicateurUn"
import calculerIndicateurDeux from "../../utils/calculsEgaProIndicateurDeux"
import calculIndicateurTrois from "../../utils/calculsEgaProIndicateurTrois"
import calculIndicateurDeuxTrois from "../../utils/calculsEgaProIndicateurDeuxTrois"
import calculerIndicateurQuatre from "../../utils/calculsEgaProIndicateurQuatre"
import calculerIndicateurCinq from "../../utils/calculsEgaProIndicateurCinq"
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

  const isEffectifsFilled = state.effectif.formValidated === "Valid"

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
  } = calculerIndicateurDeux(state)

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
  } = calculerIndicateurQuatre(state)

  const {
    indicateurSexeSousRepresente: indicateurCinqSexeSousRepresente,
    indicateurNombreSalariesSexeSousRepresente,
    noteIndicateurCinq,
  } = calculerIndicateurCinq(state)

  // TODO : il faudrait plutôt remonter l'état Valid dans le reducer quand les effectifs deviennent non calculables. Ainsi, on aurait les coches du menu gauche toujours synchronisées.
  const indicateurUnValid =
    state.indicateurUn.formValidated === "Valid" ||
    // Si l'indicateurUn n'est pas calculable par coefficient, forcer le calcul par CSP
    (!effectifsIndicateurUnCalculable && state.indicateurUn.csp) ||
    !effectifsIndicateurUnCalculable

  const indicateurDeuxTroisValid =
    state.indicateurDeuxTrois.formValidated === "Valid" ||
    !effectifsIndicateurDeuxTroisCalculable ||
    !indicateurDeuxTroisCalculable

  const indicateurDeuxValid =
    state.indicateurDeux.formValidated === "Valid" || !effectifsIndicateurDeuxCalculable || !indicateurDeuxCalculable

  const indicateurTroisValid =
    state.indicateurTrois.formValidated === "Valid" || !effectifsIndicateurTroisCalculable || !indicateurTroisCalculable

  const allIndicateurValid =
    indicateurUnValid &&
    (trancheEffectifs === "50 à 250" ? indicateurDeuxTroisValid : indicateurDeuxValid && indicateurTroisValid) &&
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
              anneeDeclaration={Number(state.informations.anneeDeclaration)}
            />
            <RecapitulatifIndicateurUn
              isEffectifsFilled={isEffectifsFilled}
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
                  isEffectifsFilled={isEffectifsFilled}
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
                  isEffectifsFilled={isEffectifsFilled}
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
                isEffectifsFilled={isEffectifsFilled}
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
          Le calcul de vos indicateurs et de votre index est terminé. Vous pouvez, si vous le souhaitez, transmettre les
          résultats obtenus aux services du ministre chargé du travail en renseignant les autres informations
          nécessaires à la déclaration.
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
