import { ReactElement, useEffect } from "react"
import Head from "next/head"
import { push } from "@socialgouv/matomo-next"
import { Box, Text } from "@chakra-ui/react"

import { SinglePageLayout } from "@/components/ds/SinglePageLayout"

export default function NotFoundPage() {
  useEffect(() => {
    push(["trackEvent", "404", "Page non trouvée"])
  }, [])

  return (
    <>
      <Head>
        <title>Page non trouvée - Index Egapro</title>
      </Head>

      <Box textAlign="center" mt="8">
        <Text as="h2" fontSize="2xl">
          Malheureusement la page que vous cherchez n'existe pas !
        </Text>
      </Box>
    </>
  )
}

NotFoundPage.getLayout = function getLayout(page: ReactElement) {
  return <SinglePageLayout>{page}</SinglePageLayout>
}
