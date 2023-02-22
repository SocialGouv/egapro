import {
  Box,
  Container,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Grid,
  useDisclosure,
  useMediaQuery,
} from "@chakra-ui/react"
import React, { PropsWithChildren, useEffect } from "react"
import { Route, RouteComponentProps, withRouter } from "react-router-dom"

import { AppState } from "../globals"

import ButtonAction from "../components/ds/ButtonAction"
import { IconMenu } from "../components/ds/Icons"
import Menu from "../components/Menu"

export type ContentProps = PropsWithChildren<{ pathname: string }>

const Content = ({ children, pathname }: ContentProps) => {
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
interface MainScrollViewProps extends PropsWithChildren<RouteComponentProps> {
  state?: AppState
}

const MainScrollView = ({ children, state, location }: MainScrollViewProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [isLargerThan1280] = useMediaQuery("(min-width: 1280px)")
  const [isSmallerThan1279] = useMediaQuery("(max-width: 1279px)")

  const menu = <Menu onClose={onClose} />

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
                gridTemplateColumns: isLargerThan1280 ? "300px 1fr 300px" : isLargerThan1280 ? "200px 1fr" : "1fr",
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
          </Grid>
        </Container>
      </Flex>
    </>
  )
}
export default withRouter(MainScrollView)
