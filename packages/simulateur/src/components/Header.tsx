import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  Container,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
  Flex,
  HStack,
  Link,
  List,
  ListItem,
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuList,
  Spacer,
  Text,
  useDisclosure,
  useMediaQuery,
} from "@chakra-ui/react"
import React from "react"
import { Link as RouterLink, useHistory } from "react-router-dom"

import { LinkIcon } from "@chakra-ui/icons"
import FAQ from "../views/FAQ"
import { useUser } from "./AuthContext"
import ButtonAction from "./ds/ButtonAction"
import ButtonLink from "./ds/ButtonLink"
import {
  IconEdit,
  IconLogout,
  IconMenu,
  IconOfficeBuilding,
  IconPeopleCircle,
  IconQuestionMarkCircle,
  IconUserGroup,
} from "./ds/Icons"
import Logo from "./ds/Logo"

const Header = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [isSmallerThan1280] = useMediaQuery("(max-width: 1279px)")
  const [isBiggerThanMobileAndSmallerThan1280] = useMediaQuery("(min-width: 640px) and (max-width: 1279px)")
  const [isLargerThan1280] = useMediaQuery("(min-width: 1280px)")
  const [isMobile] = useMediaQuery("(max-width: 639px)")
  const history = useHistory()
  const { email, logout, staff } = useUser()

  const disconnectUser = () => {
    logout()
    history.push("/tableauDeBord/me-connecter")
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
                  width={isMobile ? 16 : "fit-content"}
                  sx={{
                    display: "block",
                  }}
                >
                  <Logo />
                </Link>
              </Box>
              <Box fontFamily="custom">
                <Link as={RouterLink} to="/" fontSize={isMobile ? "md" : "2xl"} color="gray.900" lineHeight={1}>
                  Egapro
                </Link>
                {!isMobile && (
                  <Text fontSize="xs">
                    Index de l’égalité professionnelle et représentation équilibrée femmes – hommes
                  </Text>
                )}
              </Box>
            </Flex>
            <Spacer />
            <Box>
              {email ? (
                <Menu>
                  <MenuButton as={Button} variant="ghost" colorScheme="primary" leftIcon={<IconMenu boxSize={6} />}>
                    {email}
                    {staff && <Badge colorScheme="green">Staff</Badge>}
                  </MenuButton>
                  <MenuList zIndex={400}>
                    <MenuGroup title="Mon compte">
                      <MenuItem
                        as={RouterLink}
                        to="/tableauDeBord/mes-entreprises"
                        icon={<IconOfficeBuilding boxSize={5} color="gray.400" />}
                      >
                        Mes entreprises
                      </MenuItem>
                      <MenuItem
                        as={RouterLink}
                        to="/tableauDeBord/mes-declarations"
                        icon={<IconEdit boxSize={5} color="gray.400" />}
                      >
                        Mes déclarations
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
                          <MenuItem
                            as={RouterLink}
                            to="/tableauDeBord/generer-token-utilisateur"
                            icon={<LinkIcon boxSize={5} color="gray.400" />}
                          >
                            Générer token
                          </MenuItem>
                        </MenuGroup>
                      </>
                    )}
                    {isSmallerThan1280 && (
                      <>
                        <MenuDivider />
                        <MenuGroup title="Informations">
                          <MenuItem onClick={onOpen} icon={<IconQuestionMarkCircle boxSize={5} color="gray.400" />}>
                            Consulter l'aide
                          </MenuItem>
                        </MenuGroup>
                      </>
                    )}
                  </MenuList>
                </Menu>
              ) : (
                <ButtonGroup gap="0">
                  {isMobile && (
                    <>
                      <ButtonLink to="/tableauDeBord/me-connecter" label={"Me connecter"} size="xs" variant="ghost" />
                      <ButtonAction onClick={onOpen} label={"Consulter l'aide"} variant="ghost" size="xs" />
                    </>
                  )}
                  {isBiggerThanMobileAndSmallerThan1280 && (
                    <>
                      <ButtonLink
                        to="/tableauDeBord/me-connecter"
                        label={"Me connecter"}
                        leftIcon={<IconPeopleCircle />}
                        variant="ghost"
                      />
                      <ButtonAction
                        onClick={onOpen}
                        label={"Consulter l'aide"}
                        leftIcon={<IconPeopleCircle />}
                        variant="ghost"
                      />
                    </>
                  )}
                  {isLargerThan1280 && (
                    <>
                      <ButtonLink
                        to="/tableauDeBord/me-connecter"
                        label={"Me connecter"}
                        leftIcon={<IconPeopleCircle />}
                        variant="ghost"
                      />
                    </>
                  )}
                </ButtonGroup>
              )}
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
