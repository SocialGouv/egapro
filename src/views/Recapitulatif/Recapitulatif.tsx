import React, { FunctionComponent } from "react"
import { Box, VStack, Text, Tooltip, Button, Link } from "@chakra-ui/react"
import { RouteComponentProps } from "react-router-dom"

import { AppState } from "../../globals"

import { useTitle } from "../../utils/hooks"

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

import { computeValuesFromState } from "../../utils/helpers"
interface RecapitulatifProps extends RouteComponentProps {
  state: AppState
}

const title = "Récapitulatif"

const Recapitulatif: FunctionComponent<RecapitulatifProps> = ({ state }) => {
  useTitle(title)

  const {
    trancheEffectifs,
    periodeSuffisante,
    allIndicateurValid,
    noteIndex,
    totalPoint,
    totalPointCalculable,
    totalNombreSalariesHomme,
    totalNombreSalariesFemme,

    indicateurUn: {
      effectifsIndicateurUnCalculable,
      effectifEtEcartRemuParTranche,
      indicateurEcartRemuneration,
      indicateurUnSexeSurRepresente,
      noteIndicateurUn,
    },

    indicateurDeux: {
      effectifsIndicateurDeuxCalculable,
      indicateurDeuxCalculable,
      effectifEtEcartAugmentParGroupe,
      indicateurEcartAugmentation,
      indicateurDeuxSexeSurRepresente,
      noteIndicateurDeux,
      indicateurDeuxCorrectionMeasure,
    },

    indicateurTrois: {
      effectifsIndicateurTroisCalculable,
      indicateurTroisCalculable,
      effectifEtEcartPromoParGroupe,
      indicateurEcartPromotion,
      indicateurTroisSexeSurRepresente,
      noteIndicateurTrois,
      indicateurTroisCorrectionMeasure,
    },

    indicateurDeuxTrois: {
      effectifsIndicateurDeuxTroisCalculable,
      indicateurDeuxTroisCalculable,
      indicateurEcartAugmentationPromotion,
      indicateurEcartNombreEquivalentSalaries,
      indicateurDeuxTroisSexeSurRepresente,
      noteIndicateurDeuxTrois,
      indicateurDeuxTroisCorrectionMeasure,
      tauxAugmentationPromotionHommes,
      tauxAugmentationPromotionFemmes,
      plusPetitNombreSalaries,
    },

    indicateurQuatre: { indicateurQuatreCalculable, indicateurEcartNombreSalarieesAugmentees, noteIndicateurQuatre },

    indicateurCinq: {
      indicateurCinqSexeSousRepresente,
      indicateurNombreSalariesSexeSousRepresente,
      noteIndicateurCinq,
    },
  } = computeValuesFromState(state)

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
                  correctionMeasure={indicateurDeuxCorrectionMeasure}
                />
                <RecapitulatifIndicateurTrois
                  indicateurTroisFormValidated={state.indicateurTrois.formValidated}
                  effectifsIndicateurTroisCalculable={effectifsIndicateurTroisCalculable}
                  indicateurTroisCalculable={indicateurTroisCalculable}
                  effectifEtEcartPromoParGroupe={effectifEtEcartPromoParGroupe}
                  indicateurEcartPromotion={indicateurEcartPromotion}
                  indicateurSexeSurRepresente={indicateurTroisSexeSurRepresente}
                  noteIndicateurTrois={noteIndicateurTrois}
                  correctionMeasure={indicateurTroisCorrectionMeasure}
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
                correctionMeasure={indicateurDeuxTroisCorrectionMeasure}
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

        <Box mt={8}>
          <Link
            href="https://voxusagers.numerique.gouv.fr/Demarches/2240?&view-mode=formulaire-avis&nd_mode=en-ligne-enti%C3%A8rement&nd_source=button&key=73366ddb13d498f4c77d01c2983bab48"
            isExternal
          >
            <img
              src="https://voxusagers.numerique.gouv.fr/static/bouton-blanc.svg"
              alt="Je donne mon avis"
              title="Je donne mon avis sur cette démarche"
            />
          </Link>
        </Box>
      </Box>
    </Page>
  )
}

export default Recapitulatif
