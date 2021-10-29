/** @jsx jsx */
import { css, jsx } from "@emotion/core"
import { Fragment, useEffect, useState } from "react"
import { Route, Switch, useHistory } from "react-router-dom"

import { AppState, ActionType } from "../globals"

import { logToSentry } from "../utils/helpers"

import globalStyles from "../utils/globalStyles"
import { isUserGrantedForSiren } from "../utils/user"
import { getIndicatorsDatas, getTokenInfo, putIndicatorsDatas } from "../utils/api"
import { useDebounceEffect } from "../utils/hooks"

import ActivityIndicator from "../components/ActivityIndicator"
import ErrorMessage from "../components/ErrorMessage"

import Declaration from "../views/Declaration"
import Effectif from "../views/Effectif"
import HomeSimulateur, { HomeSimulateurRouteComponentProps } from "../views/HomeSimulateur"
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

interface TokenInfo {
  email: string
  déclarations: [Declaration]
  ownership: [string]
}

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
  const [tokenInfo, setTokenInfo] = useState<undefined | "error" | TokenInfo>(undefined)
  const history = useHistory()

  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.has("token")) {
    localStorage.setItem("token", urlParams.get("token") || "")
    // Reset the token in the search params so it won't be in the URL and won't be bookmarkable (which is a bad practice?)
    history.push({ search: "" })
  }
  const token = localStorage.getItem("token")

  // useEffect de récupération du token et des données de la déclaration.
  useEffect(() => {
    async function runEffect() {
      setLoading(true)
      setErrorMessage(undefined)

      let email = ""

      try {
        if (token) {
          const tokenInfo = await getTokenInfo()

          if (tokenInfo) {
            setTokenInfo(tokenInfo?.jsonBody)
            localStorage.setItem("tokenInfo", JSON.stringify(tokenInfo?.jsonBody) || "")

            email = tokenInfo?.jsonBody?.email || email
          }
        }

        const indicatorsData = await getIndicatorsDatas(code)
        setLoading(false)

        const simuData = indicatorsData?.jsonBody?.data

        const siren = simuData?.informationsEntreprise?.siren

        if (siren) {
          if (!token) {
            // On ne peut pas voir une simulation avec un SIREN rempli et qu'on n'est pas authentifié.
            // Renvoi sur le formulaire d'email (cf. plus bas).
            setErrorMessage("Veuillez renseigner votre email pour accéder à cette simulation-déclaration.")
          } else if (!isUserGrantedForSiren(siren)) {
            // On ne peut pas voir une simulation avec un SIREN rempli, si on est authentifiée et qu'on n'a pas les droits.
            setErrorMessage(
              "Vous n'êtes pas autorisé à accéder à cette simulation-déclaration, veuillez contacter votre référent de l'égalité professionnelle.",
            )
          }
        }

        dispatch({
          type: "initiateState",
          data: {
            ...simuData,
            informationsDeclarant: {
              ...simuData?.informationsDeclarant,
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
  }, [code, token, dispatch])

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
    return <AskEmail code={code} reason={errorMessage} />
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
      <Route
        path="/simulateur/:code/"
        exact
        render={(props) => {
          const foo = props as HomeSimulateurRouteComponentProps
          return <HomeSimulateur {...foo} code={code} />
        }}
      />
      <Route
        path="/simulateur/:code/informations"
        render={(props) => <InformationsSimulation {...props} state={state} dispatch={dispatch} />}
      />
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
      <Route path="/simulateur/:code/recapitulatif" render={(props) => <Recapitulatif {...props} state={state} />} />
      {tokenInfo === undefined ? (
        <AskEmail code={code} />
      ) : tokenInfo === "error" ? (
        <Fragment>
          <p></p>
          <AskEmail code={code} />
        </Fragment>
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
  )
}

const styles = {
  viewLoading: css({
    margin: "auto",
    alignSelf: "center",
  }),
}

export default Simulateur
