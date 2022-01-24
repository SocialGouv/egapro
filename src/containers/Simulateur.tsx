/** @jsx jsx */
import { css, jsx } from "@emotion/react"
import { Fragment, useEffect, useState } from "react"
import { Redirect, Route, Switch } from "react-router-dom"

import { AppState, ActionType } from "../globals"

import { logToSentry } from "../utils/helpers"

import globalStyles from "../utils/globalStyles"
import { isUserGrantedForSiren } from "../utils/user"
import { getIndicatorsDatas, putIndicatorsDatas } from "../utils/api"
import { useDebounceEffect } from "../utils/hooks"

import ActivityIndicator from "../components/ActivityIndicator"
import ErrorMessage from "../components/ErrorMessage"

import Declaration from "../views/Declaration"
import Effectif from "../views/Effectif"
import HomeSimulateur from "../views/HomeSimulateur"
import IndicateurUn from "../views/Indicateur1"
import IndicateurDeux from "../views/Indicateur2"
import IndicateurTrois from "../views/Indicateur3"
import IndicateurDeuxTrois from "../views/Indicateur2et3"
import IndicateurQuatre from "../views/Indicateur4"
import IndicateurCinq from "../views/Indicateur5"
import InformationsEntreprise from "../views/InformationsEntreprise"
import InformationsDeclarant from "../views/InformationsDeclarant"
import InformationsSimulation from "../views/InformationsSimulation"
import Recapitulatif from "../views/Recapitulatif"
import AskEmail from "../views/AskEmail"
import { sirenIsFree } from "../utils/siren"
import { useCheckTokenInURL, useUser } from "../components/AuthContext"

interface Declaration {
  declared_at: number
  modified_at: number
  name: string
  siren: string
  year: number
}

interface Props {
  code: string
  state: AppState | undefined
  dispatch: (action: ActionType) => void
}

function Simulateur({ code, state, dispatch }: Props) {
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const { email, isAuthenticated } = useUser()

  /**
   * Je cherche à faire marcher correctement useCheckTokenInUrl.
   *
   * Quand un nouveau token est détecté, on est censé avoir une tentative de login.
   * Si ok, un nouveau contexte est renvoyé, ce qui est censé changer l'email et isAuthenticated.
   *
   * De cette façon, le useEffect qui suit, qui écoute email et isAuthenticated devrait être relancé.
   * Or il ne l'est pas. ??? 🤔
   */

  useCheckTokenInURL()

  // useEffect de récupération du token et des données de la déclaration.
  useEffect(() => {
    async function runEffect() {
      setLoading(true)
      setErrorMessage(undefined)

      try {
        const indicatorsData = await getIndicatorsDatas(code)
        setLoading(false)

        const simuData = indicatorsData?.jsonBody?.data

        const siren =
          simuData?.informationsEntreprise?.formValidated === "Valid" ? simuData?.informationsEntreprise?.siren : null

        if (siren) {
          if (!isAuthenticated) {
            // On ne peut pas voir une simulation avec un SIREN rempli et qu'on n'est pas authentifié.
            // Renvoi sur le formulaire d'email (cf. plus bas).
            setErrorMessage("Veuillez renseigner votre email pour accéder à cette simulation-déclaration.")
          } else {
            // a free siren is a siren that has no owners already bound to it.
            const freeSiren = await sirenIsFree(siren)

            if (!isUserGrantedForSiren(siren) && !freeSiren) {
              // On ne peut pas voir une simulation avec un SIREN rempli, si on est authentifiée et qu'on n'a pas les droits.
              setErrorMessage(
                "Vous n'êtes pas autorisé à accéder à cette simulation-déclaration, veuillez contacter votre référent de l'égalité professionnelle.",
              )
            }
          }
        }

        dispatch({
          type: "initiateState",
          data: {
            ...simuData,
            informationsDeclarant: {
              ...simuData?.informationsDeclarant,
              // We preserve the original author email, if any.
              email: simuData?.informationsDeclarant?.email || email,
            },
          },
        })
      } catch (_error) {
        const error = _error as { jsonBody: { error: string } }
        console.error(error)
        setLoading(false)
        const message = error.jsonBody?.error
          ? `Les données de votre déclaration n'ont pû être récupérées : ${error.jsonBody.error}`
          : "Erreur lors de la récupération des données"
        setErrorMessage(message)
      }
    }

    runEffect()
  }, [code, dispatch, isAuthenticated, email])

  // useEffect pour synchroniser le state dans la db, de façon asynchrone (après 2 secondes de debounce).
  useDebounceEffect(
    state,
    2000,
    (debouncedState) => {
      if (debouncedState) {
        putIndicatorsDatas(code, debouncedState).catch((error) => {
          setLoading(false)
          const message =
            error.jsonBody && error.jsonBody.error
              ? `Votre déclaration ne peut être validée : ${error.jsonBody.error}`
              : "Erreur lors de la sauvegarde des données"
          setErrorMessage(message)
          logToSentry(error, debouncedState)
        })
      }
    },
    [code],
  )

  if (!loading && errorMessage === "Veuillez renseigner votre email pour accéder à cette simulation-déclaration.") {
    return <AskEmail reason={errorMessage} />
  }

  if (!loading && errorMessage) {
    return ErrorMessage(errorMessage)
  }

  if (loading || !state) {
    return (
      <div css={styles.viewLoading}>
        <ActivityIndicator size={30} color={globalStyles.colors.primary} />
      </div>
    )
  }

  return (
    <Switch>
      <Route path="/simulateur/:code/" exact>
        <HomeSimulateur />
      </Route>
      <Route path="/simulateur/:code/informations">
        <InformationsSimulation state={state} dispatch={dispatch} />
      </Route>

      {/*  We ensure to have the informations page always filleds before allowing to go to other form pages.  */}
      {state?.informations?.formValidated !== "Valid" ? (
        <Redirect to={`/simulateur/${code}/informations`} />
      ) : (
        <Fragment>
          <Switch>
            <Route
              path="/simulateur/:code/effectifs"
              render={(props) => <Effectif {...props} state={state} dispatch={dispatch} />}
            />
            <Route
              path="/simulateur/:code/indicateur1"
              render={(props) => <IndicateurUn {...props} state={state} dispatch={dispatch} />}
            />
            <Route
              path="/simulateur/:code/indicateur2"
              render={(props) => <IndicateurDeux {...props} state={state} dispatch={dispatch} />}
            />
            <Route
              path="/simulateur/:code/indicateur3"
              render={(props) => <IndicateurTrois {...props} state={state} dispatch={dispatch} />}
            />
            <Route
              path="/simulateur/:code/indicateur2et3"
              render={(props) => <IndicateurDeuxTrois {...props} state={state} dispatch={dispatch} />}
            />
            <Route
              path="/simulateur/:code/indicateur4"
              render={(props) => <IndicateurQuatre {...props} state={state} dispatch={dispatch} />}
            />
            <Route
              path="/simulateur/:code/indicateur5"
              render={(props) => <IndicateurCinq {...props} state={state} dispatch={dispatch} />}
            />
            <Route
              path="/simulateur/:code/recapitulatif"
              render={(props) => <Recapitulatif {...props} state={state} />}
            />
            {!isAuthenticated ? (
              <Route>
                <AskEmail />
              </Route>
            ) : (
              <Fragment>
                <Route
                  path="/simulateur/:code/informations-entreprise"
                  render={(props) => <InformationsEntreprise {...props} state={state} dispatch={dispatch} />}
                />
                <Route
                  path="/simulateur/:code/informations-declarant"
                  render={(props) => <InformationsDeclarant {...props} state={state} dispatch={dispatch} />}
                />
                <Route
                  path="/simulateur/:code/declaration"
                  render={(props) => <Declaration {...props} code={code} state={state} dispatch={dispatch} />}
                />
              </Fragment>
            )}
          </Switch>
        </Fragment>
      )}
    </Switch>
  )
}

const styles = {
  viewLoading: css({
    margin: "auto",
    alignSelf: "center",
  }),
}

export default Simulateur
