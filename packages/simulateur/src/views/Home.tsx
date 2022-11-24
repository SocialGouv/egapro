import React, { FunctionComponent, useState } from "react"
import { RouteComponentProps } from "react-router-dom"
import { Heading, SimpleGrid } from "@chakra-ui/react"

import { ActionType } from "../globals"
import { postSimulation } from "../utils/api"

import ButtonAction from "../components/ds/ButtonAction"
import ButtonLinkNoRouter from "../components/ds/ButtonLinkNoRouter"
import Card from "../components/ds/Card"
import Page from "../components/Page"
import ErrorMessage from "../components/ErrorMessage"
import { logToSentry } from "../utils/sentry"

interface HomeProps extends RouteComponentProps {
  dispatch: (action: ActionType) => void
}

const Home: FunctionComponent<HomeProps> = ({ history, location, dispatch }) => {
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(undefined)

  const onClick = () => {
    setLoading(true)
    dispatch({ type: "resetState" })

    postSimulation({})
      .then(({ jsonBody: { id } }) => {
        setLoading(false)

        history.push(`/simulateur/${id}`, location.state ? location.state : {})
      })
      .catch((error) => {
        setLoading(false)
        const errorMessage = (error.jsonBody && error.jsonBody.message) || "Erreur lors de la récupération du code"
        setErrorMessage(errorMessage)
        logToSentry(error, undefined)
      })
  }

  if (!loading && errorMessage) {
    return <ErrorMessage>{errorMessage}</ErrorMessage>
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
              to={process.env.REACT_APP_DECLARATION_URL || "/index-egapro/declaration/"}
              label="Déclarer directement"
              fullWidth
            />
          }
        />
      </SimpleGrid>
    </Page>
  )
}

export default Home
