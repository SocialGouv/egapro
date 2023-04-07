import "@fontsource/cabin"
import "@fontsource/gabriela"
import React, { FunctionComponent, useEffect } from "react"
import ReactPiwik from "react-piwik"
import { Router } from "react-router-dom"

// @ts-ignore TS doesn't find the type definition of history. No error before.
import { Box, ChakraProvider, Link, LinkProps } from "@chakra-ui/react"
import { createBrowserHistory } from "history"
import { ErrorBoundary } from "react-error-boundary"

import ActionBar from "./components/ActionBar"
import ButtonAction from "./components/ds/ButtonAction"
import InfoBlock from "./components/ds/InfoBlock"
import GridProvider from "./components/GridContext"
import Page from "./components/Page"
import AppLayout from "./containers/AppLayout"
import theme from "./theme"
import { AppStateContextProvider } from "./hooks/useAppStateContextProvider"
import { ConsentBanner, useGdprStore } from "./components/ConsentBanner"

declare module "./components/ConsentBanner" {
  interface GdprServiceNames {
    matomo: never
  }
}

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

const ErrorFallback: FunctionComponent<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <Page title="Quelque chose s'est mal passée... 😕">
      <Box bg="red" mb={4}>
        {error.message}
      </Box>
      <ActionBar>
        <ButtonAction label="retour" onClick={resetErrorBoundary} />
      </ActionBar>
    </Page>
  )
}

const history = createBrowserHistory({ basename: process.env.PUBLIC_URL })

const piwik = new ReactPiwik({
  url: "matomo.fabrique.social.gouv.fr",
  siteId: 11,
})

const trackAtConnect = false

ReactPiwik.push(["enableHeartBeatTimer"])
ReactPiwik.push(["requireCookieConsent"])
// track the initial pageview
ReactPiwik.push(["trackPageView"])

const Matomo = () => {
  const matomoConsent = useGdprStore((state) => state.consents.matomo)

  useEffect(() => {
    if (matomoConsent) {
      console.log("Activation des cookies Matomo.")
      ReactPiwik.push(["rememberCookieConsentGiven"])
    } else {
      console.log("Désactivation des cookies Matomo.")
      ReactPiwik.push(["forgetCookieConsentGiven"])
    }
  }, [matomoConsent])
  return <></>
}

const App = () => {
  return (
    <ChakraProvider theme={theme}>
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => {
          history.goBack()
        }}
      >
        <Matomo />
        <Router history={piwik.connectToHistory(history, trackAtConnect)}>
          <GridProvider>
            {/* TODO: update the following date and message when there's another announcement */}
            {new Date() < new Date("2020-02-19T14:00:00.000Z") && (
              <Box position="fixed" left={4} bottom={4} right={4} zIndex={1000}>
                <InfoBlock
                  title="Interruption de service programmée"
                  text="Le service sera indisponible le mercredi 19 février à partir de 12h30 pour une durée d'environ 1h30"
                  closeButton={true}
                />
              </Box>
            )}

            <AppStateContextProvider>
              <ConsentBanner
                gdprPageLink="/politique-de-confidentialite#cookies"
                gdprPageLinkAs={(props: LinkProps) => <Link {...props} isExternal color="blue.500" />}
                siteName="Egapro"
                services={[
                  {
                    name: "matomo",
                    title: "Matomo",
                    description: "Outil d’analyse comportementale des utilisateurs.",
                  },
                ]}
              />
              <AppLayout />
            </AppStateContextProvider>
          </GridProvider>
        </Router>
      </ErrorBoundary>
    </ChakraProvider>
  )
}

export default App
