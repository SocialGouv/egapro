import "react-app-polyfill/ie11"
import "react-app-polyfill/stable"
import React from "react"
import ReactDOM from "react-dom"
import * as Sentry from "@sentry/react"
import App from "./App"
import * as serviceWorker from "./serviceWorker"
import { ColorModeScript } from "@chakra-ui/react"
import theme from "./theme"

if (process.env.REACT_APP_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    release: process.env.REACT_APP_GITHUB_SHA,
  })
}

ReactDOM.render(
  <>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} nonce="rand0m" />
    <App />
  </>,
  document.getElementById("root"),
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
