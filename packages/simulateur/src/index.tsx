import "react-app-polyfill/ie11"
import "react-app-polyfill/stable"
import React from "react"
import ReactDOM from "react-dom"
import * as Sentry from "@sentry/react"
import App from "./App"
import * as serviceWorker from "./serviceWorker"
import { ColorModeScript } from "@chakra-ui/react"
import theme from "./theme"
import { nonce } from "./config"

if (process.env.REACT_APP_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    release: process.env.REACT_APP_GITHUB_SHA,
  })
}

if (typeof window !== "undefined") {
  const originalAppendChild = document.head.appendChild.bind(document.head)
  document.head.appendChild = (node) => {
    if (["style", "script"].includes(node.nodeName.toLocaleLowerCase())) {
      ;(node as unknown as Element).setAttribute("nonce", (node as unknown as Element).getAttribute("nonce") || nonce)
    }
    return originalAppendChild(node)
  }
}

ReactDOM.render(
  <>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} nonce={nonce} />
    <App />
  </>,
  document.getElementById("root"),
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
