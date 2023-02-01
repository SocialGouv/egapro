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

  const periodeSuffisante = state.informations.periodeSuffisante || true // For old simulations-declarations, we assume that the periodSuffisante is true.

  const calculsIndicateurUn = calculerIndicateurUn(state)
  const calculsIndicateurDeux = calculerIndicateurDeux(state)
  const calculsIndicateurTrois = calculerIndicateurTrois(state)
  const calculsIndicateurDeuxTrois = calculerIndicateurDeuxTrois(state)
  const calculsIndicateurQuatre = calculerIndicateurQuatre(state)
  const calculsIndicateurCinq = calculerIndicateurCinq(state)

  // TODO : il faudrait plutôt remonter l'état Valid dans le reducer quand les effectifs deviennent non calculables. Ainsi, on aurait les coches du menu gauche toujours synchronisées.
  const indicateurUnCompliant =
    state.indicateurUn.formValidated === "Valid" ||
    // Si l'indicateurUn n'est pas calculable par coefficient, forcer le calcul par CSP
    (!calculsIndicateurUn.effectifsIndicateurCalculable && state.indicateurUn.csp) ||
    !calculsIndicateurUn.effectifsIndicateurCalculable

  const indicateurDeuxCompliant =
    state.indicateurDeux.formValidated === "Valid" ||
    !calculsIndicateurDeux.effectifsIndicateurCalculable ||
    !calculsIndicateurDeux.indicateurCalculable

  const indicateurTroisCompliant =
    state.indicateurTrois.formValidated === "Valid" ||
    !calculsIndicateurTrois.effectifsIndicateurCalculable ||
    !calculsIndicateurTrois.indicateurCalculable

  const indicateurDeuxTroisCompliant =
    state.indicateurDeuxTrois.formValidated === "Valid" ||
    !calculsIndicateurDeuxTrois.effectifsIndicateurCalculable ||
    !calculsIndicateurDeuxTrois.indicateurCalculable

  const allIndicateursCompliant =
    indicateurUnCompliant &&
    (trancheEffectifs === "50 à 250"
      ? indicateurDeuxTroisCompliant
      : indicateurDeuxCompliant && indicateurTroisCompliant) &&
    state.indicateurQuatre.formValidated === "Valid" &&
    state.indicateurCinq.formValidated === "Valid"

  const { noteIndex, totalPoint, totalPointCalculable } = calculerNoteIndex(
    trancheEffectifs,
    calculsIndicateurUn.noteIndicateurUn,
    calculsIndicateurDeux.noteIndicateurDeux,
    calculsIndicateurTrois.noteIndicateurTrois,
    calculsIndicateurDeuxTrois.noteIndicateurDeuxTrois,
    calculsIndicateurQuatre.noteIndicateurQuatre,
    calculsIndicateurCinq.noteIndicateurCinq,
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
              allIndicateurValid={allIndicateursCompliant}
              noteIndex={noteIndex}
              totalPoint={totalPoint}
              totalPointCalculable={totalPointCalculable}
            />
            <RecapitulatifIndicateurUn calculsIndicateurUn={calculsIndicateurUn} />

            {trancheEffectifs !== "50 à 250" ? (
              <>
                <RecapitulatifIndicateurDeux calculsIndicateurDeux={calculsIndicateurDeux} />

                <RecapitulatifIndicateurTrois calculsIndicateurTrois={calculsIndicateurTrois} />
              </>
            ) : (
              <RecapitulatifIndicateurDeuxTrois calculsIndicateurDeuxTrois={calculsIndicateurDeuxTrois} />
            )}

            <RecapitulatifIndicateurQuatre calculsIndicateurQuatre={calculsIndicateurQuatre} />

            <RecapitulatifIndicateurCinq calculsIndicateurCinq={calculsIndicateurCinq} />
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
