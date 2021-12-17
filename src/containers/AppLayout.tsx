import React from "react"
import { Flex } from "@chakra-ui/react"

import { Route, Switch, Redirect, RouteProps } from "react-router-dom"

import { AppState, ActionType } from "../globals"

import { useLayoutType } from "../components/GridContext"
import Header from "../components/Header"

import CGU from "../views/CGU"
import Home from "../views/Home"
import MentionsLegales from "../views/MentionsLegales"
import PolitiqueConfidentialite from "../views/PolitiqueConfidentialite"
import PageNotFound from "../views/PageNotFound"

import Simulateur from "./Simulateur"
import MainScrollView from "./MainScrollView"
import MobileLayout from "./MobileLayout"
import Accessibilite from "../views/Accessibilite"
import MesEntreprises from "../views/private/MesEntreprises"
import MonProfil from "../views/private/MonProfil"
import Mire from "../views/Mire"
import { AuthContextProvider, useUser } from "../components/AuthContext"
import Footer from "../components/Footer"
import GererUtilisateursPage from "../views/private/GererUtilisateursPage"

interface Props {
  state: AppState | undefined
  dispatch: (action: ActionType) => void
}

/**
 * A wrapper for <Route> that redirects to the login screen if you're not yet authenticated.
 */
function PrivateRoute({ children, ...rest }: RouteProps) {
  const { isAuthenticated } = useUser()
  return <Route {...rest} render={() => (isAuthenticated ? children : <Redirect to="/tableauDeBord/me-connecter" />)} />
}

function AppLayout({ state, dispatch }: Props) {
  const layoutType = useLayoutType()

  return (
    <AuthContextProvider>
      <Switch>
        <Route path="/tableauDeBord/me-connecter" exact component={Mire} />
        <PrivateRoute path="/tableauDeBord/mes-entreprises" exact>
          <MesEntreprises />
        </PrivateRoute>
        <PrivateRoute path="/tableauDeBord/gerer-utilisateurs" exact>
          <GererUtilisateursPage />
        </PrivateRoute>
        <PrivateRoute path="/tableauDeBord/mon-profil" exact>
          <MonProfil />
        </PrivateRoute>
        <Route
          render={() => {
            document.title = "Index Egapro"

            return layoutType === "mobile" ? (
              <MobileLayout />
            ) : (
              <Flex direction="column" sx={{ minHeight: "100%" }}>
                <Header />
                <MainScrollView state={state}>
                  <Switch>
                    <Route path="/" exact render={(props) => <Home {...props} dispatch={dispatch} />} />
                    <Route
                      path="/simulateur/:code"
                      render={({
                        match: {
                          params: { code },
                        },
                      }) => <Simulateur code={code} state={state} dispatch={dispatch} />}
                    />
                    <Route path="/mentions-legales" exact render={() => <MentionsLegales />} />
                    <Route path="/accessibilite" exact render={() => <Accessibilite />} />
                    <Route path="/cgu" exact render={() => <CGU />} />
                    <Route path="/politique-confidentialite" exact render={() => <PolitiqueConfidentialite />} />
                    <Route component={PageNotFound} />
                  </Switch>
                </MainScrollView>
                <Footer />
              </Flex>
            )
          }}
        />
      </Switch>
    </AuthContextProvider>
  )
}

export default AppLayout
