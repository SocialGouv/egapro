import { Box, Button, Text, Tooltip, VStack } from "@chakra-ui/react"
import React, { FunctionComponent } from "react"

import { useTitle } from "../../utils/hooks"

import { calculerNoteIndex } from "../../utils/calculsEgaProIndex"
import calculerIndicateurCinq from "../../utils/calculsEgaProIndicateurCinq"
import calculerIndicateurDeux from "../../utils/calculsEgaProIndicateurDeux"
import calculerIndicateurDeuxTrois from "../../utils/calculsEgaProIndicateurDeuxTrois"
import calculerIndicateurQuatre from "../../utils/calculsEgaProIndicateurQuatre"
import calculerIndicateurTrois from "../../utils/calculsEgaProIndicateurTrois"
import calculerIndicateurUn from "../../utils/calculsEgaProIndicateurUn"
import totalNombreSalaries from "../../utils/totalNombreSalaries"

import ActionBar from "../../components/ActionBar"
import Page from "../../components/Page"
import { ButtonSimulatorLink } from "../../components/SimulatorLink"

import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import RecapitulatifIndex from "./RecapitulatifIndex"
import RecapitulatifIndicateurCinq from "./RecapitulatifIndicateurCinq"
import RecapitulatifIndicateurDeux from "./RecapitulatifIndicateurDeux"
import RecapitulatifIndicateurDeuxTrois from "./RecapitulatifIndicateurDeuxTrois"
import RecapitulatifIndicateurQuatre from "./RecapitulatifIndicateurQuatre"
import RecapitulatifIndicateurTrois from "./RecapitulatifIndicateurTrois"
import RecapitulatifIndicateurUn from "./RecapitulatifIndicateurUn"
import RecapitulatifInformations from "./RecapitulatifInformations"

const title = "Récapitulatif"

const Recapitulatif: FunctionComponent = () => {
  useTitle(title)

  const { state } = useAppStateContextProvider()

  if (!state) return null

  const trancheEffectifs = state.informations.trancheEffectifs

  const periodeSuffisante = state.informations.periodeSuffisante as boolean

  const isEffectifsFilled = state.effectif.formValidated === "Valid"

  const {
    effectifsIndicateurCalculable: effectifsIndicateurUnCalculable,
    effectifEtEcartRemuParTranche,
    indicateurEcartRemuneration,
    indicateurSexeSurRepresente: indicateurUnSexeSurRepresente,
    noteIndicateurUn,
  } = calculerIndicateurUn(state)

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
  } = calculerIndicateurTrois(state)

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
  } = calculerIndicateurDeuxTrois(state)

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

  const allIndicateursValid =
    indicateurUnValid &&
    (trancheEffectifs === "50 à 250" ? indicateurDeuxTroisValid : indicateurDeuxValid && indicateurTroisValid) &&
    state.indicateurQuatre.formValidated === "Valid" &&
    state.indicateurCinq.formValidated === "Valid"

  const { noteIndex, totalPoint, totalPointCalculable } = calculerNoteIndex(
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
          nombreSalaries={totalNombreSalariesHomme + totalNombreSalariesFemme}
          periodeSuffisante={periodeSuffisante}
        />
        {periodeSuffisante && (
          <>
            <RecapitulatifIndex
              allIndicateurValid={allIndicateursValid}
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
