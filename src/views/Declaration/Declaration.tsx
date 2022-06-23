import React, { useCallback, ReactNode, useState, useEffect, FunctionComponent } from "react"
import { RouteComponentProps, useHistory } from "react-router-dom"
import { Heading, ListItem, UnorderedList } from "@chakra-ui/react"

import {
  AppState,
  FormState,
  ActionType,
  ActionDeclarationData,
  DeclarationIndicateurUnData,
  DeclarationIndicateurDeuxData,
  DeclarationIndicateurTroisData,
  DeclarationIndicateurDeuxTroisData,
  DeclarationIndicateurQuatreData,
  DeclarationIndicateurCinqData,
  DeclarationEffectifData,
} from "../../globals"

import calculIndicateurUn, {
  calculEcartTauxRemunerationParTrancheAgeCoef,
  calculEcartTauxRemunerationParTrancheAgeCSP,
} from "../../utils/calculsEgaProIndicateurUn"
import calculIndicateurDeux, { calculEcartTauxAugmentationParCSP } from "../../utils/calculsEgaProIndicateurDeux"
import calculIndicateurTrois, { calculEcartTauxPromotionParCSP } from "../../utils/calculsEgaProIndicateurTrois"
import calculIndicateurDeuxTrois from "../../utils/calculsEgaProIndicateurDeuxTrois"
import calculIndicateurQuatre from "../../utils/calculsEgaProIndicateurQuatre"
import calculIndicateurCinq from "../../utils/calculsEgaProIndicateurCinq"
import { calculNoteIndex } from "../../utils/calculsEgaProIndex"

import InfoBlock from "../../components/ds/InfoBlock"
import Page from "../../components/Page"
import LayoutFormAndResult from "../../components/LayoutFormAndResult"

import DeclarationForm from "./DeclarationForm"
import RecapitulatifIndex from "../Recapitulatif/RecapitulatifIndex"
import { TextSimulatorLink } from "../../components/SimulatorLink"
import totalNombreSalaries from "../../utils/totalNombreSalaries"
import { putDeclaration, putIndicatorsDatas } from "../../utils/api"
import { formatDataForAPI, logToSentry } from "../../utils/helpers"
import { useTitle } from "../../utils/hooks"
import { isFormValid } from "../../utils/formHelpers"

function buildHelpers(state: AppState) {
  const trancheEffectifs = state.informations.trancheEffectifs

  const { totalNombreSalariesHomme, totalNombreSalariesFemme } = totalNombreSalaries(state.effectif.nombreSalaries)

  const effectifData: DeclarationEffectifData = {
    nombreSalariesTotal: totalNombreSalariesFemme + totalNombreSalariesHomme,
  }

  const {
    effectifsIndicateurCalculable: effectifsIndicateurUnCalculable,
    indicateurEcartRemuneration,
    indicateurSexeSurRepresente: indicateurUnSexeSurRepresente,
    noteIndicateurUn,
  } = calculIndicateurUn(state)

  const {
    effectifsIndicateurCalculable: effectifsIndicateurDeuxCalculable,
    indicateurEcartAugmentation,
    indicateurSexeSurRepresente: indicateurDeuxSexeSurRepresente,
    correctionMeasure: indicateurDeuxCorrectionMeasure,
    noteIndicateurDeux,
  } = calculIndicateurDeux(state)

  const {
    effectifsIndicateurCalculable: effectifsIndicateurTroisCalculable,
    indicateurEcartPromotion,
    indicateurSexeSurRepresente: indicateurTroisSexeSurRepresente,
    correctionMeasure: indicateurTroisCorrectionMeasure,
    noteIndicateurTrois,
  } = calculIndicateurTrois(state)

  const {
    effectifsIndicateurCalculable: effectifsIndicateurDeuxTroisCalculable,
    indicateurEcartAugmentationPromotion,
    indicateurEcartNombreEquivalentSalaries,
    indicateurSexeSurRepresente: indicateurDeuxTroisSexeSurRepresente,
    noteEcartTaux: noteEcart,
    noteEcartNombreSalaries: noteNombreSalaries,
    correctionMeasure: indicateurDeuxTroisCorrectionMeasure,
    noteIndicateurDeuxTrois,
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
    (isFormValid(state.indicateurUn) ||
      // Si l'indicateurUn n'est pas calculable par coefficient, forcer le calcul par CSP
      (!effectifsIndicateurUnCalculable && state.indicateurUn.csp)) &&
    (trancheEffectifs !== "50 à 250"
      ? (isFormValid(state.indicateurDeux) || !effectifsIndicateurDeuxCalculable) &&
        (isFormValid(state.indicateurTrois) || !effectifsIndicateurTroisCalculable)
      : isFormValid(state.indicateurDeuxTrois) || !effectifsIndicateurDeuxTroisCalculable) &&
    isFormValid(state.indicateurQuatre) &&
    isFormValid(state.indicateurCinq)

  const indicateurUnData: DeclarationIndicateurUnData = {
    nombreCoefficients: state.indicateurUn.csp ? undefined : state.indicateurUn.coefficient.length,
    nonCalculable: !effectifsIndicateurUnCalculable,
    motifNonCalculable: !effectifsIndicateurUnCalculable ? "egvi40pcet" : "",
    // TODO: demander le motif de non calculabilité si "autre" ?
    motifNonCalculablePrecision: "",
    remunerationAnnuelle: calculEcartTauxRemunerationParTrancheAgeCSP(state.indicateurUn.remunerationAnnuelle),
    coefficient: calculEcartTauxRemunerationParTrancheAgeCoef(state.indicateurUn.coefficient),
    resultatFinal: indicateurEcartRemuneration,
    sexeSurRepresente: indicateurUnSexeSurRepresente,
    noteFinale: noteIndicateurUn,
  }

  const indicateurDeuxData: DeclarationIndicateurDeuxData = {
    nonCalculable: !effectifsIndicateurDeuxCalculable,
    motifNonCalculable: !effectifsIndicateurDeuxCalculable
      ? "egvi40pcet"
      : state.indicateurDeux.presenceAugmentation
      ? ""
      : "absaugi",
    // TODO: demander le motif de non calculabilité si "autre" ?
    motifNonCalculablePrecision: "",
    tauxAugmentation: calculEcartTauxAugmentationParCSP(state.indicateurDeux.tauxAugmentation),
    resultatFinal: indicateurEcartAugmentation,
    sexeSurRepresente: indicateurDeuxSexeSurRepresente,
    noteFinale: noteIndicateurDeux,
    mesuresCorrection: indicateurDeuxCorrectionMeasure,
  }

  const indicateurTroisData: DeclarationIndicateurTroisData = {
    nonCalculable: !effectifsIndicateurTroisCalculable,
    motifNonCalculable: !effectifsIndicateurTroisCalculable
      ? "egvi40pcet"
      : state.indicateurTrois.presencePromotion
      ? ""
      : "absprom",
    // TODO: demander le motif de non calculabilité si "autre" ?
    motifNonCalculablePrecision: "",
    tauxPromotion: calculEcartTauxPromotionParCSP(state.indicateurTrois.tauxPromotion),
    resultatFinal: indicateurEcartPromotion,
    sexeSurRepresente: indicateurTroisSexeSurRepresente,
    noteFinale: noteIndicateurTrois,
    mesuresCorrection: indicateurTroisCorrectionMeasure,
  }

  const indicateurDeuxTroisData: DeclarationIndicateurDeuxTroisData = {
    nonCalculable: !effectifsIndicateurDeuxTroisCalculable,
    motifNonCalculable: !effectifsIndicateurDeuxTroisCalculable
      ? "etsno5f5h"
      : state.indicateurDeuxTrois.presenceAugmentationPromotion
      ? ""
      : "absaugi",
    // TODO: demander le motif de non calculabilité si "autre" ?
    motifNonCalculablePrecision: "",
    resultatFinalEcart: indicateurEcartAugmentationPromotion,
    resultatFinalNombreSalaries: indicateurEcartNombreEquivalentSalaries,
    sexeSurRepresente: indicateurDeuxTroisSexeSurRepresente,
    noteEcart,
    noteNombreSalaries,
    noteFinale: noteIndicateurDeuxTrois,
    mesuresCorrection: indicateurDeuxTroisCorrectionMeasure,
  }

  const indicateurQuatreData: DeclarationIndicateurQuatreData = {
    nonCalculable: !indicateurQuatreCalculable,
    motifNonCalculable: state.indicateurQuatre.presenceCongeMat
      ? state.indicateurQuatre.nombreSalarieesPeriodeAugmentation === 0
        ? "absaugpdtcm"
        : ""
      : "absretcm",
    // TODO: demander le motif de non calculabilité si "autre" ?
    motifNonCalculablePrecision: "",
    resultatFinal: indicateurEcartNombreSalarieesAugmentees,
    noteFinale: noteIndicateurQuatre,
  }

  const indicateurCinqData: DeclarationIndicateurCinqData = {
    resultatFinal: indicateurNombreSalariesSexeSousRepresente,
    sexeSurRepresente:
      indicateurCinqSexeSousRepresente === "femmes"
        ? "hommes"
        : indicateurCinqSexeSousRepresente === "hommes"
        ? "femmes"
        : indicateurCinqSexeSousRepresente,
    noteFinale: noteIndicateurCinq,
  }

  const { noteIndex, totalPoint, totalPointCalculable } = calculNoteIndex(
    trancheEffectifs,
    noteIndicateurUn,
    noteIndicateurDeux,
    noteIndicateurTrois,
    noteIndicateurDeuxTrois,
    noteIndicateurQuatre,
    noteIndicateurCinq,
  )

  return {
    trancheEffectifs,
    allIndicateurValid,
    effectifData,
    indicateurUnData,
    indicateurDeuxData,
    indicateurTroisData,
    indicateurDeuxTroisData,
    indicateurQuatreData,
    indicateurCinqData,
    noteIndex,
    totalPoint,
    totalPointCalculable,
  }
}

interface DeclarationProps extends RouteComponentProps {
  code: string
  state: AppState
  dispatch: (action: ActionType) => void
}

const title = "Déclaration"

const Declaration: FunctionComponent<DeclarationProps> = ({ code, state, dispatch }) => {
  useTitle(title)
  const history = useHistory()

  const [declaring, setDeclaring] = useState(false)
  const [apiError, setApiError] = useState<string | undefined>(undefined)

  const updateDeclaration = useCallback(
    (data: ActionDeclarationData) => dispatch({ type: "updateDeclaration", data }),
    [dispatch],
  )

  const resetDeclaration = useCallback(() => {
    history.push(`/nouvelle-simulation`)
  }, [history])

  const helpers = buildHelpers(state)

  const {
    indicateurUnData,
    indicateurDeuxData,
    indicateurTroisData,
    indicateurDeuxTroisData,
    indicateurQuatreData,
    indicateurCinqData,
    trancheEffectifs,
    allIndicateurValid,
    effectifData,
    noteIndex,
    totalPoint,
    totalPointCalculable,
  } = helpers

  const validateDeclaration = (valid: FormState) => {
    if (valid === "Valid") {
      setDeclaring(true)
    } else {
      setDeclaring(false)
    }
    if (!apiError) {
      return dispatch({
        type: "validateDeclaration",
        valid,
        effectifData,
        indicateurUnData,
        indicateurDeuxData,
        indicateurTroisData,
        indicateurDeuxTroisData,
        indicateurQuatreData,
        indicateurCinqData,
        noteIndex,
        totalPoint,
        totalPointCalculable,
      })
    }
  }

  useEffect(() => {
    if (declaring) {
      const data = formatDataForAPI(code, state)
      putIndicatorsDatas(code, state)
        .then(() => {
          putDeclaration(data)
            .then(() => {
              setApiError(undefined)
              setDeclaring(false)
            })
            .catch((error) => {
              setDeclaring(false)
              const message =
                error.jsonBody && error.jsonBody.error
                  ? `Votre déclaration ne peut être validée : ${error.jsonBody.error}`
                  : "Erreur lors de la sauvegarde des données"
              setApiError(message)
              validateDeclaration("None")
              if (error.response.status !== 403) {
                // Don't log on 403 because it's n expected error:
                // "Votre déclaration ne peut être validée : Cette déclaration a déjà
                // été créée par un autre utilisateur".
                logToSentry(error, data)
              }
            })
        })
        .catch((error) => {
          setDeclaring(false)
          const message =
            error.jsonBody && error.jsonBody.error
              ? `Votre déclaration ne peut être validée : ${error.jsonBody.error}`
              : "Erreur lors de la sauvegarde des données"
          setApiError(message)
          validateDeclaration("None")
          logToSentry(error, data)
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- validateDeclaration is not needed to be subscribed on change.
  }, [code, declaring, state])

  if (!state.informations.periodeSuffisante) {
    return (
      <PageDeclaration>
        <LayoutFormAndResult
          childrenForm={
            <>
              <InfoBlock
                type="warning"
                text="Vous ne disposez pas d'une période de référence de 12 mois consécutifs, vos indicateurs et votre index ne sont pas calculables."
              />
              <DeclarationForm
                state={state}
                noteIndex={noteIndex}
                updateDeclaration={updateDeclaration}
                resetDeclaration={resetDeclaration}
                validateDeclaration={validateDeclaration}
                apiError={apiError}
                declaring={declaring}
              />
            </>
          }
          childrenResult={null}
        />
      </PageDeclaration>
    )
  }

  // tous les formulaires ne sont pas encore validés
  if (
    !allIndicateurValid ||
    !isFormValid(state.informations) ||
    !isFormValid(state.effectif) ||
    !isFormValid(state.informationsEntreprise) ||
    !isFormValid(state.informationsDeclarant)
  ) {
    return (
      <PageDeclaration>
        <InfoBlock
          type="warning"
          title="Vous devez renseigner tous les indicateurs ainsi que les informations relatives à la déclaration avant de pouvoir valider"
          text="Certains des indicateurs et/ou certaines informations relatives à la déclaration sont manquantes."
        />
        <Heading as="h2" size="md" mt={6}>
          Les formulaires suivants ne sont pas validés
        </Heading>
        <UnorderedList mt={2}>
          {!isFormValid(state.informations) && (
            <ListItem>
              <TextSimulatorLink to="/informations" label="Informations calcul et période de référence" />
            </ListItem>
          )}
          {!isFormValid(state.effectif) && (
            <ListItem>
              <TextSimulatorLink to="/effectifs" label="Effectifs pris en compte" />
            </ListItem>
          )}
          {!isFormValid(state.indicateurUn) &&
            ((indicateurUnData.nonCalculable && !state.indicateurUn.csp) || !indicateurUnData.nonCalculable) && (
              <ListItem>
                <TextSimulatorLink to="/indicateur1" label="Indicateur écart de rémunération" />
              </ListItem>
            )}
          {trancheEffectifs !== "50 à 250" && !isFormValid(state.indicateurDeux) && !indicateurDeuxData.nonCalculable && (
            <ListItem>
              <TextSimulatorLink to="/indicateur2" label="Indicateur écart de taux d'augmentations" />
            </ListItem>
          )}
          {trancheEffectifs !== "50 à 250" &&
            !isFormValid(state.indicateurTrois) &&
            !indicateurTroisData.nonCalculable && (
              <ListItem>
                <TextSimulatorLink to="/indicateur3" label="Indicateur écart de taux de promotions" />
              </ListItem>
            )}
          {trancheEffectifs === "50 à 250" &&
            !isFormValid(state.indicateurDeuxTrois) &&
            !indicateurDeuxTroisData.nonCalculable && (
              <ListItem>
                <TextSimulatorLink to="/indicateur2et3" label="Indicateur écart de taux d'augmentations" />
              </ListItem>
            )}
          {!isFormValid(state.indicateurQuatre) && (
            <ListItem>
              <TextSimulatorLink to="/indicateur4" label="Indicateur retour de congé maternité" />
            </ListItem>
          )}
          {!isFormValid(state.indicateurCinq) && (
            <ListItem>
              <TextSimulatorLink to="/indicateur5" label="Indicateur hautes rémunérations" />
            </ListItem>
          )}
          {!isFormValid(state.informationsEntreprise) && (
            <ListItem>
              <TextSimulatorLink to="/informations-entreprise" label="Informations entreprise/UES" />
            </ListItem>
          )}
          {!isFormValid(state.informationsDeclarant) && (
            <ListItem>
              <TextSimulatorLink to="/informations-declarant" label="Informations déclarant" />
            </ListItem>
          )}
        </UnorderedList>
      </PageDeclaration>
    )
  }

  return (
    <PageDeclaration>
      <LayoutFormAndResult
        childrenForm={
          <>
            <RecapitulatifIndex
              allIndicateurValid={allIndicateurValid}
              noteIndex={noteIndex}
              totalPoint={totalPoint}
              totalPointCalculable={totalPointCalculable}
            />
            <DeclarationForm
              state={state}
              noteIndex={noteIndex}
              updateDeclaration={updateDeclaration}
              resetDeclaration={resetDeclaration}
              validateDeclaration={validateDeclaration}
              apiError={apiError}
              declaring={declaring}
            />
          </>
        }
        childrenResult={null}
      />
    </PageDeclaration>
  )
}

function PageDeclaration({ children }: { children: ReactNode }) {
  return (
    <Page
      title={title}
      tagline="Une fois toutes les informations relatives à la déclaration fournies dans les différents formulaires, validez votre déclaration."
    >
      {children}
    </Page>
  )
}

export default Declaration
