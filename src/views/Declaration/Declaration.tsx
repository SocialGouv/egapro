/** @jsx jsx */
import { jsx } from "@emotion/react"
import { useCallback, Fragment, ReactNode, useState, useEffect } from "react"
import { RouteComponentProps } from "react-router-dom"

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

import InfoBloc from "../../components/ds/InfoBloc"
import Page from "../../components/Page"
import LayoutFormAndResult from "../../components/LayoutFormAndResult"

import DeclarationForm from "./DeclarationForm"
import RecapitulatifIndex from "../Recapitulatif/RecapitulatifIndex"
import { TextSimulatorLink } from "../../components/SimulatorLink"
import totalNombreSalaries from "../../utils/totalNombreSalaries"
import { putDeclaration, putIndicatorsDatas } from "../../utils/api"
import { formatDataForAPI, logToSentry } from "../../utils/helpers"
import { useTitle } from "../../utils/hooks"

interface Props extends RouteComponentProps {
  code: string
  state: AppState
  dispatch: (action: ActionType) => void
}

const title = "Déclaration"

function Declaration({ code, state, dispatch }: Props) {
  useTitle(title)

  const [declaring, setDeclaring] = useState(false)
  const [apiError, setApiError] = useState<string | undefined>(undefined)

  const updateDeclaration = useCallback(
    (data: ActionDeclarationData) => dispatch({ type: "updateDeclaration", data }),
    [dispatch],
  )

  const { totalNombreSalariesHomme, totalNombreSalariesFemme } = totalNombreSalaries(state.effectif.nombreSalaries)

  const nombreSalariesTotal = totalNombreSalariesFemme + totalNombreSalariesHomme

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

  const trancheEffectifs = state.informations.trancheEffectifs

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

  const effectifData: DeclarationEffectifData = {
    nombreSalariesTotal,
  }

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

  const validateDeclaration = useCallback(
    (valid: FormState) => {
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
    },
    [
      dispatch,
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
      apiError,
    ],
  )

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
  }, [code, declaring, state, validateDeclaration])

  // tous les formulaires ne sont pas encore validés
  if (
    !allIndicateurValid ||
    state.informationsEntreprise.formValidated !== "Valid" ||
    state.informationsDeclarant.formValidated !== "Valid"
  ) {
    return (
      <PageDeclaration>
        <InfoBloc
          type="warning"
          title="Vous devez renseigner tous les indicateurs ainsi que les informations relatives à la déclaration avant de pouvoir valider"
          text="Certains des indicateurs et/ou certaines informations relatives à la déclaration sont manquantes."
        />
        <h2>Les formulaires suivants ne sont pas validés</h2>
        <ul>
          {state.informations.formValidated !== "Valid" && (
            <li>
              <TextSimulatorLink to="/informations" label="informations calcul et période de référence" />
            </li>
          )}
          {state.effectif.formValidated !== "Valid" && (
            <li>
              <TextSimulatorLink to="/effectifs" label="effectifs pris en compte" />
            </li>
          )}
          {state.indicateurUn.formValidated !== "Valid" &&
            ((!effectifsIndicateurUnCalculable && !state.indicateurUn.csp) || effectifsIndicateurUnCalculable) && (
              <li>
                <TextSimulatorLink to="/indicateur1" label="l'indicateur écart de rémunération" />
              </li>
            )}
          {trancheEffectifs !== "50 à 250" &&
            state.indicateurDeux.formValidated !== "Valid" &&
            effectifsIndicateurDeuxCalculable && (
              <li>
                <TextSimulatorLink to="/indicateur2" label="l'indicateur écart de taux d'augmentations" />
              </li>
            )}
          {trancheEffectifs !== "50 à 250" &&
            state.indicateurTrois.formValidated !== "Valid" &&
            effectifsIndicateurTroisCalculable && (
              <li>
                <TextSimulatorLink to="/indicateur3" label="l'indicateur écart de taux de promotions" />
              </li>
            )}
          {trancheEffectifs === "50 à 250" &&
            state.indicateurDeuxTrois.formValidated !== "Valid" &&
            effectifsIndicateurDeuxTroisCalculable && (
              <li>
                <TextSimulatorLink to="/indicateur2et3" label="l'indicateur écart de taux d'augmentations" />
              </li>
            )}
          {state.indicateurQuatre.formValidated !== "Valid" && (
            <li>
              <TextSimulatorLink to="/indicateur4" label="l'indicateur retour de congé maternité" />
            </li>
          )}
          {state.indicateurCinq.formValidated !== "Valid" && (
            <li>
              <TextSimulatorLink to="/indicateur5" label="l'indicateur hautes rémunérations" />
            </li>
          )}
          {state.informationsEntreprise.formValidated !== "Valid" && (
            <li>
              <TextSimulatorLink to="/informations-entreprise" label="les informations entreprise/UES" />
            </li>
          )}
          {state.informationsDeclarant.formValidated !== "Valid" && (
            <li>
              <TextSimulatorLink to="/informations-declarant" label="les informations déclarant" />
            </li>
          )}
        </ul>
      </PageDeclaration>
    )
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
              state={state}
              noteIndex={noteIndex}
              indicateurUnParCSP={state.indicateurUn.csp}
              finPeriodeReference={state.informations.finPeriodeReference}
              readOnly={state.declaration.formValidated === "Valid" && !declaring}
              updateDeclaration={updateDeclaration}
              validateDeclaration={validateDeclaration}
              apiError={apiError}
              declaring={declaring}
            />
          </Fragment>
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
      tagline="Une fois toutes les informations relatives à la déclaration fournies dans les différents formulaires, validez votre déclaration"
    >
      {children}
    </Page>
  )
}

export default Declaration
