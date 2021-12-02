/** @jsx jsx */
import { css, jsx } from "@emotion/core"
import { useReducer, useCallback } from "react"
import { Router } from "react-router-dom"
import ReactPiwik from "react-piwik"
import { createBrowserHistory } from "history"
import { ErrorBoundary } from "react-error-boundary"
import { ChakraProvider, extendTheme } from "@chakra-ui/react"
import defaultTheme from "@chakra-ui/theme"
import { createBreakpoints, StyleFunctionProps } from "@chakra-ui/theme-tools"

import { ActionType } from "./globals"
import AppReducer from "./AppReducer"
import GridProvider from "./components/GridContext"
import AppLayout from "./containers/AppLayout"
import InfoBloc from "./components/InfoBloc"
import Page from "./components/Page"
import ActionBar from "./components/ActionBar"
import ButtonAction from "./components/ButtonAction"

// Chakra UI custom theme
const appTheme = {
  config: {
    initialColorMode: "light",
    useSystemColorMode: false,
  },
  styles: {
    // Reuse the defaut styles from index.css.
    global: {
      body: {
        fontFamily: '"Cabin", -apple-system, sans-serif',
        fontWeight: "400",
        color: "#191a49",
      },
      a: {
        color: "teal.500",
      },
    },
  },
  components: {
    Input: {
      variants: {
        "blue-outline": (props: StyleFunctionProps) => ({
          ...defaultTheme.components.Input.variants.outline(props),
          field: {
            ...defaultTheme.components.Input.variants.outline(props).field,
            border: "1px solid",
            borderColor: "blue.100",
          },
        }),
      },
    },
  },
}

const breakpoints = createBreakpoints({
  sm: "30em",
  md: "48em",
  lg: "64rem",
  xl: "80rem",
  "2xl": "96em",
})

const theme = extendTheme({
  appTheme,
  breakpoints,
  colors: {
    primary: {
      50: "#f8f8fd",
      100: "#f0f0fa",
      200: "#dadaf3",
      300: "#c3c4ec",
      400: "#9698de",
      500: "#696cd0",
      600: "#5f61bb",
      700: "#4f519c",
      800: "#3f417d",
      900: "#333566",
    },
  },
})

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
                <InfoBloc
                  title="Interruption de service programmée"
                  text="Le service sera indisponible le mercredi 19 février à partir de 12h30 pour une durée d'environ 1h30"
                  additionalCss={styles.banner}
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
    left: 0,
    top: 60,
    width: "100%",
    zIndex: 1000,
  }),
  banner: css({
    backgroundColor: "#fff",
    margin: "10px auto",
    width: "70%",
  }),
}

export default App
