import "@fontsource/gabriela"
import "@fontsource/cabin"

import React from "react"
import { ChakraProvider } from "@chakra-ui/react"
import { init } from "@socialgouv/matomo-next"

import type { ReactElement, ReactNode } from "react"
import type { NextPage } from "next"
import type { AppProps } from "next/app"

import theme from "../theme"

type NextPageWithLayout = NextPage & {
  // eslint-disable-next-line no-unused-vars
  getLayout?: (page: ReactElement) => ReactNode
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

export default function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  React.useEffect(() => {
    init({
      url: process.env.NEXT_PUBLIC_MATOMO_URL ?? "",
      siteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID ?? "",
    })
  }, [])

  // Use the layout defined at the page level, if available

  const getLayout = Component.getLayout ?? ((page) => page)

  const componentWithLayout = getLayout(<Component {...pageProps} />)

  return <ChakraProvider theme={theme}>{componentWithLayout}</ChakraProvider>
}
