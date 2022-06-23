import React, { FunctionComponent } from "react"
import { useHistory, Link as RouterLink } from "react-router-dom"
import {
  Box,
  Container,
  Link,
  Flex,
  Text,
  ListItem,
  List,
  HStack,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  useMediaQuery,
  Spacer,
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuList,
  Button,
} from "@chakra-ui/react"

import {
  IconLogin,
  IconLogout,
  IconMenu,
  IconOfficeBuilding,
  IconPeople,
  IconQuestionMarkCircle,
  IconUserGroup,
} from "./ds/Icons"
import Logo from "./ds/Logo"
import { useUser } from "./AuthContext"
import FAQ from "../views/FAQ"

const Header: FunctionComponent = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [isSmallerThan1280] = useMediaQuery("(max-width: 1279px)")
  const [isMobile] = useMediaQuery("(max-width: 639px)")
  const history = useHistory()
  const { email, logout, staff } = useUser()

  const disconnectUser = () => {
    logout()
    history.go(0)
  }
  return (
    <>
      <Box
        as="header"
        role="banner"
        bg="white"
        sx={{
          flexShrink: 0,
          borderBottom: "1px solid #E3E4ED",
          "@media print": {
            display: "none",
          },
        }}
      >
        <Box
          bg="white"
          fontSize="xs"
          sx={{
            height: 0,
            overflow: "hidden",
            borderBottom: "1px solid #f1f2fb",
            transform: "translateY(-100%)",
            ":focus-within": {
              height: "auto",
              transform: "translateY(0%)",
            },
          }}
        >
          <Container maxW="container.xl">
            <HStack as={List} spacing={4}>
              <ListItem>
                <Link href="#menu">Aller au menu</Link>
              </ListItem>
              <ListItem>
                <Link href="#main">Aller au contenu</Link>
              </ListItem>
              <ListItem>
                <Link href="#search">Aller à l'aide</Link>
              </ListItem>
              <ListItem>
                <Link href="#footer">Aller au pied de page</Link>
              </ListItem>
            </HStack>
          </Container>
        </Box>
        <Container maxW="container.xl" id="menu">
          <Flex align="center" py={4}>
            <Flex direction="row" align="center">
              <Box pr={6}>
                <Link
                  href="https://travail-emploi.gouv.fr/"
                  isExternal
                  width={isMobile ? 16 : 20}
                  sx={{
                    display: "block",
                  }}
                >
                  <Logo />
                </Link>
              </Box>
              <Box fontFamily="custom">
                <Link as={RouterLink} to="/" fontSize={isMobile ? "lg" : "2xl"} color="gray.900">
                  Index Egapro
                </Link>
                {!isMobile && (
                  <Text fontSize="xs">
                    L’outil de calcul et de déclaration de votre index égalité professionnelle Femmes-Hommes
                  </Text>
                )}
              </Box>
            </Flex>
            <Spacer />
            <Box>
              <Menu>
                <MenuButton as={Button} variant="ghost" colorScheme="primary" leftIcon={<IconMenu boxSize={6} />}>
                  Menu
                </MenuButton>
                <MenuList zIndex={400}>
                  {email ? (
                    <>
                      <MenuGroup title="Mon compte">
                        <MenuItem
                          as={RouterLink}
                          to="/tableauDeBord/mon-profil"
                          icon={<IconPeople boxSize={5} color="gray.400" />}
                        >
                          Mon Profil
                        </MenuItem>
                        <MenuItem
                          as={RouterLink}
                          to="/tableauDeBord/mes-entreprises"
                          icon={<IconOfficeBuilding boxSize={5} color="gray.400" />}
                        >
                          Mes entreprises
                        </MenuItem>
                        <MenuItem onClick={disconnectUser} icon={<IconLogout boxSize={5} color="gray.400" />}>
                          Déconnexion
                        </MenuItem>
                      </MenuGroup>
                      {staff && (
                        <>
                          <MenuDivider />
                          <MenuGroup title="Administration">
                            <MenuItem
                              as={RouterLink}
                              to="/tableauDeBord/gerer-utilisateurs"
                              icon={<IconUserGroup boxSize={5} color="gray.400" />}
                            >
                              Gérer utilisateurs
                            </MenuItem>
                          </MenuGroup>
                        </>
                      )}
                    </>
                  ) : (
                    <MenuGroup>
                      <MenuItem
                        as={RouterLink}
                        to="/tableauDeBord/me-connecter"
                        icon={<IconLogin boxSize={5} color="gray.400" />}
                      >
                        Me connecter
                      </MenuItem>
                    </MenuGroup>
                  )}

                  {isSmallerThan1280 && (
                    <>
                      <MenuDivider />
                      <MenuGroup title="Informations">
                        <MenuItem onClick={onOpen} icon={<IconQuestionMarkCircle boxSize={5} color="gray.400" />}>
                          Aide
                        </MenuItem>
                      </MenuGroup>
                    </>
                  )}
                </MenuList>
              </Menu>
            </Box>
          </Flex>
        </Container>
      </Box>
      {isSmallerThan1280 && (
        <>
          <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
            <DrawerOverlay />
            <DrawerContent>
              <DrawerCloseButton sx={{ zIndex: 20 }} />
              <DrawerBody p={0}>
                <FAQ />
              </DrawerBody>
            </DrawerContent>
          </Drawer>
        </>
      )}
    </>
  )
}

export default Header
