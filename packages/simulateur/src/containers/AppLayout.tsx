import { Flex, Spinner } from "@chakra-ui/react"
import React from "react"

import { Redirect, Route, RouteProps, Switch } from "react-router-dom"

import Header from "../components/Header"

import Home from "../views/Home"
import PageNotFound from "../views/PageNotFound"

import { AuthContextProvider, useUser } from "../components/AuthContext"
import Footer from "../components/Footer"
import { useAppStateContextProvider } from "../hooks/useAppStateContextProvider"
import Accessibilite from "../views/Accessibilite"
import Mire from "../views/Mire"
import GenererTokenUtilisateurPage from "../views/private/GenererTokenUtilisateurPage"
import GererUtilisateursPage from "../views/private/GererUtilisateursPage"
import MesDeclarations from "../views/private/MesDeclarations"
import MesEntreprises from "../views/private/MesEntreprises"
import MonProfil from "../views/private/MonProfil"
import ObjectifsMesuresPage from "../views/private/ObjectifsMesuresPage"
import ResetPage from "../views/ResetPage"
import MainScrollView from "./MainScrollView"
import Simulateur from "./Simulateur"
import { SinglePageLayout } from "./SinglePageLayout"

/**
 * A wrapper for <Route> that redirects to the login screen if you're not yet authenticated.
 *
 * @param staffOnly true is only staff member can access this page
 */
function PrivateRoute({ children, staffOnly, ...rest }: RouteProps & { staffOnly?: boolean }) {
  const { isAuthenticated, staff, loading: isLoadingAuth } = useUser()

  if (isLoadingAuth) return <Spinner />

  if (!isAuthenticated) return <Mire />

  if (staffOnly && !staff) return <Redirect to="/tableauDeBord/mes-declarations" />

  return <Route {...rest} render={() => children as React.ReactNode} />
}

function DashboardRoutes() {
  return (
    <Switch>
      <Route path="/tableauDeBord/me-connecter" exact>
        <Mire />
      </Route>
      <PrivateRoute path="/tableauDeBord/mes-entreprises" exact>
        <MesEntreprises />
      </PrivateRoute>
      <PrivateRoute path="/tableauDeBord/mes-declarations" exact>
        <MesDeclarations />
      </PrivateRoute>
      <PrivateRoute path="/tableauDeBord/mes-declarations/:siren" exact>
        <MesDeclarations />
      </PrivateRoute>
      <PrivateRoute path="/tableauDeBord/objectifs-mesures/:siren/:year" exact>
        <ObjectifsMesuresPage />
      </PrivateRoute>
      <PrivateRoute path="/tableauDeBord/gerer-utilisateurs" staffOnly exact>
        <GererUtilisateursPage />
      </PrivateRoute>
      <PrivateRoute path="/tableauDeBord/generer-token-utilisateur" staffOnly exact>
        <GenererTokenUtilisateurPage />
      </PrivateRoute>
      <PrivateRoute path="/tableauDeBord/mon-profil" exact>
        <MonProfil />
      </PrivateRoute>
    </Switch>
  )
}

function AppLayout() {
  const { state } = useAppStateContextProvider()

  return (
    <AuthContextProvider>
      <Switch>
        <Route path="/nouvelle-simulation" exact render={() => <ResetPage />} />

        <Route path="/tableauDeBord/">
          <DashboardRoutes />
        </Route>

        <Route path="/accessibilite" exact>
          <SinglePageLayout>
            <Accessibilite />
          </SinglePageLayout>
        </Route>

        <>
          <Flex direction="column">
            <Header />
            <MainScrollView state={state}>
              <Switch>
                <Route path="/" exact render={(props) => <Home {...props} />} />
                <Route path="/simulateur/:code">
                  <Simulateur />
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
