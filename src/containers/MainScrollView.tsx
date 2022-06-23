import React, { useEffect, ReactNode, FunctionComponent } from "react"
import {
  Container,
  Box,
  Flex,
  Grid,
  useMediaQuery,
  useDisclosure,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  DrawerCloseButton,
  DrawerBody,
} from "@chakra-ui/react"
import { withRouter, RouteComponentProps, Route } from "react-router-dom"

import { AppState } from "../globals"

import Menu from "../components/Menu"
import FAQ from "../views/FAQ"
import ButtonAction from "../components/ds/ButtonAction"
import { IconMenu } from "../components/ds/Icons"

interface MainScrollViewProps extends RouteComponentProps {
  children: ReactNode
  state: AppState | undefined
}

const MainScrollView: FunctionComponent<MainScrollViewProps> = ({ children, state, location }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [isLargerThan1280] = useMediaQuery("(min-width: 1280px)")
  const [isSmallerThan1279] = useMediaQuery("(max-width: 1279px)")

  const menu = (
    <Menu
      onClose={onClose}
      trancheEffectifs={state ? state.informations.trancheEffectifs : "50 à 250"}
      periodeSuffisante={state ? state.informations.periodeSuffisante : undefined}
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
    <>
      <Flex
        grow={1}
        sx={{
          height: "100%",
        }}
        as={"main"}
        role="main"
        id="main"
      >
        <Container maxW={{ base: "container.lg", xl: "container.xl" }}>
          {isSmallerThan1279 && (
            <Route path="/simulateur/:code">
              <Box pt={6}>
                <ButtonAction
                  onClick={onOpen}
                  variant="outline"
                  colorScheme="gray"
                  size="sm"
                  label="Étapes du simulateur"
                  leftIcon={<IconMenu boxSize={6} />}
                />
              </Box>
              <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="md">
                <DrawerOverlay />
                <DrawerContent>
                  <DrawerHeader>Calcul et déclaration de l'index</DrawerHeader>
                  <DrawerCloseButton sx={{ zIndex: 20 }} />
                  <DrawerBody>{menu}</DrawerBody>
                </DrawerContent>
              </Drawer>
            </Route>
          )}
          <Grid
            sx={{
              "@media screen": {
                gridTemplateColumns: isLargerThan1280 ? "200px 1fr 380px" : isLargerThan1280 ? "200px 1fr" : "1fr",
                gridTemplateRows: "auto",
                gridTemplateAreas: isLargerThan1280 ? "'nav main aside'" : isLargerThan1280 ? "'nav main'" : "'main'",
                height: "100%",
              },
            }}
          >
            {isLargerThan1280 && (
              <Box
                ml={-3}
                sx={{
                  gridArea: "nav",
                  "@media print": {
                    display: "none",
                    marginLeft: 0,
                    borderRight: "none",
                  },
                }}
              >
                {menu}
              </Box>
            )}
            <Content pathname={location.pathname}>{children}</Content>
            {isLargerThan1280 && (
              <Box
                bg="white"
                mr={isLargerThan1280 ? -3 : 0}
                sx={{
                  gridArea: "aside",
                  "@media print": {
                    display: "none",
                  },
                }}
              >
                <FAQ />
              </Box>
            )}
          </Grid>
        </Container>
      </Flex>
    </>
  )
}

function Content({ children, pathname }: { children: ReactNode; pathname: string }) {
  const [isLargerThan1280] = useMediaQuery("(min-width: 1280px)")

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <Box
      px={isLargerThan1280 ? 8 : 0}
      py={isLargerThan1280 ? 10 : 6}
      sx={{
        gridArea: "main",
        borderRight: isLargerThan1280 ? "1px solid #E3E4ED" : "none",
        "@media print": {
          paddingLeft: 0,
          paddingRight: 0,
          borderRight: "none",
        },
      }}
    >
      {children}
    </Box>
  )
}
export default withRouter(MainScrollView)
