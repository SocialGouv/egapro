import React, { ReactElement, useState } from "react"
import { Heading, SimpleGrid } from "@chakra-ui/react"
import { useRouter } from "next/router"

// import { ActionType } from "../globals"
import { postIndicatorsDatas } from "../utils/api"

import ButtonAction from "../components/ds/ButtonAction"
import ButtonLinkNoRouter from "../components/ds/ButtonLinkNoRouter"
import Card from "../components/ds/Card"
import Page from "../components/Page"
import ErrorMessage from "../components/ErrorMessage"
import { logToSentry } from "../utils/sentry"
import type { NextPageWithLayout } from "../../../_app"
// import MainScrollView from "../containers/MainScrollView"
import StaticPageWithFaqLayout from "../containers/StaticPageWithFaqLayout"

/*
interface HomeProps {
  dispatch: (action: ActionType) => void
}
*/

const Home: NextPageWithLayout = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(undefined)

  const onClick = () => {
    setLoading(true)
    // dispatch({ type: 'resetState' })

    postIndicatorsDatas({})
      .then(({ jsonBody: { id } }) => {
        setLoading(false)

        // history.push(`/simulateur/${id}`, location.state ? location.state : {})
        router.push(`/simulateur/${id}`)
      })
      .catch((error) => {
        setLoading(false)
        const errorMessage = (error.jsonBody && error.jsonBody.message) || "Erreur lors de la récupération du code"
        setErrorMessage(errorMessage)
        logToSentry(error, undefined)
      })
  }

  if (!loading && errorMessage) {
    return ErrorMessage(errorMessage)
  }

  return (
    <Page
      title="Bienvenue sur Index Egapro"
      tagline={[
        "L’Index de l'égalité professionnelle a été conçu pour faire progresser au sein des entreprises l’égalité salariale entre les femmes et les hommes.",
        "Il permet aux entreprises de mesurer, en toute transparence, les écarts de rémunération entre les sexes et de mettre en évidence leurs points de progression. Lorsque des disparités salariales sont constatées, des mesures de correction doivent être prises.",
      ]}
    >
      <Heading as="h2" size="md" mb={6}>
        Comment calculer et déclarer l’index égalité femmes-hommes&nbsp;?
      </Heading>
      <SimpleGrid columns={{ base: 1, sm: 2, md: 1, lg: 2 }} spacing={6}>
        <Card
          img={{
            url: "illustration-simulator.svg",
          }}
          legend="Choix 1"
          title={{
            node: "h3",
            text: "Calcul et déclaration de l'index",
          }}
          content="Vous pouvez calculer votre index égalité professionnelle F/H sur Index Egapro et le déclarer, si vous le souhaitez, suite au calcul."
          action={
            <ButtonAction
              onClick={onClick}
              label="Commencer le calcul"
              disabled={loading}
              loading={loading}
              fullWidth
            />
          }
        />
        <Card
          img={{
            url: "illustration-publish.svg",
          }}
          legend="Choix 2"
          title={{
            node: "h3",
            text: "Déclaration directe de l'index",
          }}
          content="Vous pouvez déclarer votre index égalité professionnelle F/H calculé par ailleurs directement via le
                formulaire suivant."
          action={
            <ButtonLinkNoRouter
              to={process.env.NEXT_PUBLIC_DECLARATION_URL || "/declaration/"}
              label="Déclarer directement"
              fullWidth
            />
          }
        />
      </SimpleGrid>
    </Page>
  )
}

/**
Home.getLayout = function getLayout(page: ReactElement) {
  return (
    <SinglePageLayout>
      <MainScrollView state={undefined}>{page}</MainScrollView>
    </SinglePageLayout>
  )
}
*/

Home.getLayout = function getLayout(page: ReactElement) {
  return <StaticPageWithFaqLayout>{page}</StaticPageWithFaqLayout>
}

export default Home
