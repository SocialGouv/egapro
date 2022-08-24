import React, { useReducer, useCallback, FunctionComponent } from "react"
import { Router } from "react-router-dom"
import "@fontsource/gabriela"
import "@fontsource/cabin"
import ReactPiwik from "react-piwik"

// @ts-ignore TS doesn't find the type definition of history. No error before.
import { createBrowserHistory } from "history"
import { ErrorBoundary } from "react-error-boundary"
import { Box, ChakraProvider } from "@chakra-ui/react"

import theme from "./theme"
import { ActionType } from "./globals"
import AppReducer from "./AppReducer"
import GridProvider from "./components/GridContext"
import AppLayout from "./containers/AppLayout"
import InfoBlock from "./components/ds/InfoBlock"
import Page from "./components/Page"
import ActionBar from "./components/ActionBar"
import ButtonAction from "./components/ds/ButtonAction"

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

const history = createBrowserHistory()

const piwik: any = new ReactPiwik({
  url: "matomo.fabrique.social.gouv.fr",
  siteId: 11,
  trackErrors: true,
})

// track the initial pageview
ReactPiwik.push(["trackPageView"])

const App: FunctionComponent = () => {
  const [state, dispatchReducer] = useReducer(AppReducer, undefined)

  const dispatch = useCallback(
    (action: ActionType) => {
      if (
        action.type.startsWith("validate") &&
        // @ts-ignore
        action.valid &&
        // @ts-ignore
        action.valid === "Valid"
      ) {
        ReactPiwik.push(["trackEvent", "validateForm", action.type])
      }
      dispatchReducer(action)
    },
    [dispatchReducer],
  )

  return (
    <ChakraProvider theme={theme}>
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => {
          history.goBack()
        }}
      >
        <Router history={piwik.connectToHistory(history)}>
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

            <AppLayout state={state} dispatch={dispatch} />
          </GridProvider>
        </Router>
      </ErrorBoundary>
    </ChakraProvider>
  )
}

export default App
