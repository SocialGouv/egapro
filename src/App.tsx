/** @jsx jsx */
import { css, jsx } from "@emotion/react"
import { useReducer, useCallback } from "react"
import { Router } from "react-router-dom"
import ReactPiwik from "react-piwik"
import { createBrowserHistory } from "history"
import { ErrorBoundary } from "react-error-boundary"
import { ChakraProvider } from "@chakra-ui/react"
import theme from "./theme"
import { ActionType } from "./globals"
import AppReducer from "./AppReducer"
import GridProvider from "./components/GridContext"
import AppLayout from "./containers/AppLayout"
import InfoBlock from "./components/ds/InfoBlock"
import Page from "./components/Page"
import ActionBar from "./components/ActionBar"
import ButtonAction from "./components/ButtonAction"

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <Page title="Quelque chose s'est mal passée... 😕">
      <div style={{ color: "red", marginBottom: 20 }}>{error.message}</div>
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

function App() {
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
              <div css={styles.bannerWrapper}>
                <InfoBlock
                  title="Interruption de service programmée"
                  text="Le service sera indisponible le mercredi 19 février à partir de 12h30 pour une durée d'environ 1h30"
                  closeButton={true}
                />
              </div>
            )}

            <AppLayout state={state} dispatch={dispatch} />
          </GridProvider>
        </Router>
      </ErrorBoundary>
    </ChakraProvider>
  )
}

const styles = {
  bannerWrapper: css({
    position: "fixed",
    left: 20,
    bottom: 20,
    right: 20,
    zIndex: 1000,
  }),
  banner: css({
    backgroundColor: "#fff",
    margin: "10px auto",
    width: "70%",
  }),
}

export default App
