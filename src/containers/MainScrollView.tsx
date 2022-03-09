import React, { useEffect, ReactNode } from "react"
import { Container, Box, Flex, Grid } from "@chakra-ui/react"
import { withRouter, RouteComponentProps } from "react-router-dom"

import { AppState } from "../globals"

import { useScrollTo } from "../components/ScrollContext"
import Menu from "../components/Menu"
import FAQ from "../views/FAQ"

interface Props extends RouteComponentProps {
  children: ReactNode
  state: AppState | undefined
}

function MainScrollView({ children, state, location }: Props) {
  const menu = (
    <Menu
      trancheEffectifs={state ? state.informations.trancheEffectifs : "50 à 250"}
      informationsFormValidated={state ? state.informations.formValidated : "None"}
      effectifFormValidated={state ? state.effectif.formValidated : "None"}
      indicateurUnFormValidated={state ? state.indicateurUn.formValidated : "None"}
      indicateurDeuxFormValidated={state ? state.indicateurDeux.formValidated : "None"}
      indicateurTroisFormValidated={state ? state.indicateurTrois.formValidated : "None"}
      indicateurDeuxTroisFormValidated={state ? state.indicateurDeuxTrois.formValidated : "None"}
      indicateurQuatreFormValidated={state ? state.indicateurQuatre.formValidated : "None"}
      indicateurCinqFormValidated={state ? state.indicateurCinq.formValidated : "None"}
      informationsEntrepriseFormValidated={state ? state.informationsEntreprise.formValidated : "None"}
      informationsDeclarantFormValidated={state ? state.informationsDeclarant.formValidated : "None"}
      declarationFormValidated={state ? state.declaration.formValidated : "None"}
    />
  )

  return (
    <Flex
      grow={1}
      sx={{
        height: "100%",
      }}
      as={"main"}
      role="main"
      id="main"
    >
      <Container maxW="container.xl">
        <Grid
          sx={{
            gridTemplateColumns: "200px 1fr 380px",
            gridTemplateRows: "auto",
            gridTemplateAreas: "'nav main aside'",
            height: "100%",
          }}
        >
          <Box sx={{ gridArea: "nav" }} ml={-3}>
            {menu}
          </Box>
          <Content pathname={location.pathname}>{children}</Content>
          <Box bg="white" sx={{ gridArea: "aside" }} mr={-3}>
            <FAQ />
          </Box>
        </Grid>
      </Container>
    </Flex>
  )
}

function Content({ children, pathname }: { children: ReactNode; pathname: string }) {
  const scrollTo = useScrollTo()

  useEffect(() => scrollTo(0), [pathname, scrollTo])

  return (
    <Box px={8} py={10} sx={{ gridArea: "main", borderRight: "1px solid #E3E4ED" }}>
      {children}
    </Box>
  )
}
export default withRouter(MainScrollView)
