/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react"
import { Fragment, ReactNode, useEffect, useState } from "react"
import { Redirect, Route, Switch, useParams } from "react-router-dom"

import { getSimulation, putSimulation } from "../utils/api"
import globalStyles from "../utils/globalStyles"
import { useDebounceEffect } from "../utils/hooks"
import { isUserGrantedForSiren } from "../utils/user"

import ActivityIndicator from "../components/ActivityIndicator"
import ErrorMessage from "../components/ErrorMessage"

import { Text } from "@chakra-ui/react"
import { useCheckTokenInURL, useUser } from "../components/AuthContext"
import TextLink from "../components/ds/TextLink"
import { useAppStateContextProvider } from "../hooks/useAppStateContextProvider"
import { logToSentry } from "../utils/sentry"
import { sirenIsFree } from "../utils/siren"
import AskEmail from "../views/AskEmail"
import Declaration from "../views/Declaration"
import Effectif from "../views/Effectif"
import HomeSimulateur from "../views/HomeSimulateur"
import IndicateurUn from "../views/Indicateur1"
import IndicateurDeux from "../views/Indicateur2"
import IndicateurDeuxTrois from "../views/Indicateur2et3"
import IndicateurTrois from "../views/Indicateur3"
import IndicateurQuatre from "../views/Indicateur4"
import IndicateurCinq from "../views/Indicateur5"
import InformationsDeclarant from "../views/InformationsDeclarant"
import InformationsEntreprise from "../views/InformationsEntreprise"
import InformationsSimulation from "../views/InformationsSimulation"
import Recapitulatif from "../views/Recapitulatif"

type Params = {
  code: string
}

function Simulateur(): JSX.Element {
  const { code } = useParams<Params>()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | undefined | ReactNode>(undefined)
  const { email, isAuthenticated, loading: isLoadingAuth } = useUser()
  const { state, dispatch } = useAppStateContextProvider()

  // useEffect de récupération des données de la déclaration.
  useEffect(() => {
    async function runEffect() {
      setLoading(true)
      setErrorMessage(undefined)

      try {
        const simulation = await getSimulation(code)

        const simuData = simulation?.jsonBody?.data

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
                <>
                  <Text>
                    Votre email de connexion ({email}) n'est pas rattaché au numéro Siren de l'entreprise. Vous devez
                    faire une demande de rattachement en remplissant le formulaire{" "}
                    <TextLink to="/ajout-declarant" isExternal>
                      ici
                    </TextLink>
                    .
                  </Text>
                </>,
              )
            }
          }
        }

        setLoading(false)

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

    if (!isLoadingAuth) runEffect()
  }, [code, dispatch, isAuthenticated, isLoadingAuth, email])

  // useEffect pour synchroniser le state dans la db, de façon asynchrone (après 2 secondes de debounce).
  useDebounceEffect(
    state,
    2000,
    (debouncedState) => {
      if (debouncedState) {
        putSimulation(code, debouncedState).catch((error) => {
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

  // Check to see if the link is a magic link.
  useCheckTokenInURL()

  if (isLoadingAuth) return <ActivityIndicator />

  if (!loading && errorMessage === "Veuillez renseigner votre email pour accéder à cette simulation-déclaration.") {
    return (
      <AskEmail>
        <Text>
          Pour accéder à cette simulation-déclaration, veuillez saisir l'email utilisé ou un des emails rattachés au
          Siren de votre entreprise.
        </Text>
        <Text mt={2}>
          <strong>Attention :</strong> en cas d'email erroné, vous ne pourrez pas accéder à cette simulation-déclaration
          déjà transmise.
        </Text>
      </AskEmail>
    )
  }

  if (!loading && errorMessage) {
    return <ErrorMessage>{errorMessage}</ErrorMessage>
  }

  if (loading || !state) {
    return (
      <div css={styles.viewLoading}>
        <ActivityIndicator color={globalStyles.colors.primary} />
      </div>
    )
  }

  return (
    <Switch>
      <Route path="/simulateur/:code/" exact>
        <HomeSimulateur />
      </Route>
      <Route path="/simulateur/:code/informations">
        <InformationsSimulation />
      </Route>

      {/*  We ensure to have the informations page always filleds before allowing to go to other form pages.  */}
      {state?.informations?.formValidated !== "Valid" ? (
        <Redirect to={`/simulateur/${code}/informations`} />
      ) : (
        <Fragment>
          <Switch>
            <Route path="/simulateur/:code/effectifs" render={() => <Effectif />} />
            <Route path="/simulateur/:code/indicateur1" render={() => <IndicateurUn />} />
            <Route path="/simulateur/:code/indicateur2" render={() => <IndicateurDeux />} />
            <Route path="/simulateur/:code/indicateur3" render={() => <IndicateurTrois />} />
            <Route path="/simulateur/:code/indicateur2et3" render={() => <IndicateurDeuxTrois />} />
            <Route path="/simulateur/:code/indicateur4" render={() => <IndicateurQuatre />} />
            <Route path="/simulateur/:code/indicateur5" render={() => <IndicateurCinq />} />
            <Route path="/simulateur/:code/recapitulatif" render={() => <Recapitulatif />} />
            {!isAuthenticated ? (
              <Route>
                <AskEmail>
                  <Text>
                    L'email doit correspondre à celui de la personne à contacter par les services de l’inspection du
                    travail en cas de besoin et sera celui sur lequel sera adressé l’accusé de réception en fin de
                    déclaration.
                  </Text>
                  <Text mt={2}>
                    <strong>Attention :</strong> en cas d'email erroné, vous ne pourrez pas remplir le formulaire de
                    déclaration.
                  </Text>
                </AskEmail>
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
