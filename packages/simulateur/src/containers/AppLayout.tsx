import React from "react"
import { Flex, Spinner } from "@chakra-ui/react"

import { Route, Switch, Redirect, RouteProps } from "react-router-dom"

import { AppState, ActionType } from "../globals"

import Header from "../components/Header"

import PageNotFound from "../views/PageNotFound"

import Simulateur from "./Simulateur"
import MainScrollView from "./MainScrollView"
import MesEntreprises from "../views/private/MesEntreprises"
import MonProfil from "../views/private/MonProfil"
import Mire from "../views/Mire"
import { AuthContextProvider, useUser } from "../components/AuthContext"
import Footer from "../components/Footer"
import GererUtilisateursPage from "../views/private/GererUtilisateursPage"
import ResetPage from "../views/ResetPage"
import GenererTokenUtilisateurPage from "../views/private/GenererTokenUtilisateurPage"
import MesDeclarations from "../views/private/MesDeclarations"
import ObjectifsMesuresPage from "../views/private/ObjectifsMesuresPage"

interface Props {
  state: AppState | undefined
  dispatch: (action: ActionType) => void
}

/**
 * A wrapper for <Route> that redirects to the login screen if you're not yet authenticated.
 *
 * @param staffOnly true is only staff member can access this page
 */
function PrivateRoute({ children, staffOnly, ...rest }: RouteProps & { staffOnly?: boolean }) {
  const { isAuthenticated, staff, loading: isLoadingAuth } = useUser()

  if (isLoadingAuth) return <Spinner />

  if (!isAuthenticated) return <Mire />

  if (staffOnly && !staff) return <Redirect to="/mon-espace/mes-declarations" />

  return <Route {...rest} render={() => children} />
}

function DashboardRoutes() {
  return (
    <Switch>
      <Route path="/mon-espace/me-connecter" exact>
        <Mire />
      </Route>
      <PrivateRoute path="/mon-espace/mes-entreprises" exact>
        <MesEntreprises />
      </PrivateRoute>
      <PrivateRoute path="/mon-espace/mes-declarations" exact>
        <MesDeclarations />
      </PrivateRoute>
      <PrivateRoute path="/mon-espace/mes-declarations/:siren" exact>
        <MesDeclarations />
      </PrivateRoute>
      <PrivateRoute path="/mon-espace/objectifs-mesures/:siren/:year" exact>
        <ObjectifsMesuresPage />
      </PrivateRoute>
      <PrivateRoute path="/mon-espace/gerer-utilisateurs" staffOnly exact>
        <GererUtilisateursPage />
      </PrivateRoute>
      <PrivateRoute path="/mon-espace/generer-token-utilisateur" staffOnly exact>
        <GenererTokenUtilisateurPage />
      </PrivateRoute>
      <PrivateRoute path="/mon-espace/mon-profil" exact>
        <MonProfil />
      </PrivateRoute>
    </Switch>
  )
}

function AppLayout({ state, dispatch }: Props) {
  return (
    <AuthContextProvider>
      <Switch>
        <Route
          path="/simulateur/nouvelle-simulation"
          exact
          render={(props) => <ResetPage {...props} dispatch={dispatch} state={state} />}
        />

        <Route path="/mon-espace/">
          <DashboardRoutes />
        </Route>

        <>
          <Flex direction="column">
            <Header />
            <MainScrollView state={state}>
              <Switch>
                <Route path="/simulateur/:code">
                  <Simulateur state={state} dispatch={dispatch} />
                </Route>
                <Route>
                  <PageNotFound />
                </Route>
              </Switch>
            </MainScrollView>
            <Footer />
          </Flex>
        </>
      </Switch>
    </AuthContextProvider>
  )
}

export default AppLayout
