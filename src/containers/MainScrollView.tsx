import React, { useEffect, ReactNode } from "react"
import { Container, Box } from "@chakra-ui/react"
import { withRouter, RouteComponentProps } from "react-router-dom"

import { AppState } from "../globals"

import ModalProvider from "../components/ModalContext"
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
    <Box
      sx={{
        display: "flex",
        height: "100%",
        flex: "1 0 auto",
      }}
    >
      <Container maxW="container.xl">
        <ModalProvider>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "200px 1fr 380px",
              gridTemplateRows: "auto",
              gridTemplateAreas: "'nav main aside'",
              height: "100%",
            }}
          >
            <Box sx={{ gridArea: "nav" }} ml={-3}>
              {menu}
            </Box>
            <MainView pathname={location.pathname}>{children}</MainView>
            <Box bg="white" sx={{ gridArea: "aside" }} mr={-3}>
              <FAQ />
            </Box>
          </Box>
        </ModalProvider>
      </Container>
    </Box>
  )
}

function MainView({ children, pathname }: { children: ReactNode; pathname: string }) {
  const scrollTo = useScrollTo()

  useEffect(() => scrollTo(0), [pathname, scrollTo])

  return (
    <Box
      as={"main"}
      px={8}
      py={10}
      sx={{ gridArea: "main", borderRight: "1px solid #E3E4ED" }}
      role="main"
      id="main"
      tabIndex={-1}
    >
      {children}
    </Box>
  )
}
export default withRouter(MainScrollView)
