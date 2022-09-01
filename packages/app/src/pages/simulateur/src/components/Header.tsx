import {
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
import React, { FunctionComponent, useEffect, useState } from "react"
import { useRouter } from "next/router"
import NextLink from "next/link"

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
  IconPeople,
  IconPeopleCircle,
  IconQuestionMarkCircle,
  IconUserGroup,
} from "./ds/Icons"
import Logo from "./ds/Logo"

const Header: FunctionComponent = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const router = useRouter()
  const { email, logout, staff } = useUser()

  const disconnectUser = () => {
    logout()
    router.push("/tableauDeBord/me-connecter")
  }
  const [isMobile, setIsMobile] = useState<Boolean>(false)
  const [isSmallerThan639] = useMediaQuery("(max-width: 639px)")

  useEffect(() => {
    if (isSmallerThan639 !== isMobile) {
      setIsMobile(isSmallerThan639)
    }
  }, [isMobile, isSmallerThan639])

  const [isFAQMenuDisplayed, setIsFAQMenuDisplayed] = useState<Boolean>(false)
  const [isSmallerThan1280] = useMediaQuery("(max-width: 1279px)")

  useEffect(() => {
    if (isSmallerThan1280 !== isFAQMenuDisplayed) {
      setIsFAQMenuDisplayed(isSmallerThan1280)
    }
  }, [isFAQMenuDisplayed, isSmallerThan1280])

  const [isXLScreen, setIsXLScreen] = useState<Boolean>(false)
  const [isLargerThan1280] = useMediaQuery("(min-width: 1280px)")

  useEffect(() => {
    if (isLargerThan1280 !== isXLScreen) {
      setIsXLScreen(isLargerThan1280)
    }
  }, [isXLScreen, isLargerThan1280])

  const [isDesktop, setIsDesktop] = useState<Boolean>(false)
  const [isBiggerThanMobileAndSmallerThan1280] = useMediaQuery("(min-width: 640px) and (max-width: 1279px)")

  useEffect(() => {
    if (isBiggerThanMobileAndSmallerThan1280 !== isDesktop) {
      setIsDesktop(isBiggerThanMobileAndSmallerThan1280)
    }
  }, [isDesktop, isBiggerThanMobileAndSmallerThan1280])

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
                <NextLink href="https://travail-emploi.gouv.fr/">
                  <Link
                    isExternal
                    width={isMobile ? 16 : 20}
                    sx={{
                      display: "block",
                    }}
                  >
                    <Logo />
                  </Link>
                </NextLink>
              </Box>
              <Box fontFamily="custom">
                <NextLink href="/">
                  <Link fontSize={isMobile ? "md" : "2xl"} color="gray.900" lineHeight={1}>
                    Index Egapro
                  </Link>
                </NextLink>
                {!isMobile && (
                  <Text fontSize="xs">
                    L’outil de calcul et de déclaration de votre index égalité professionnelle Femmes-Hommes
                  </Text>
                )}
              </Box>
            </Flex>
            <Spacer />
            <Box>
              {email ? (
                <Menu>
                  <MenuButton as={Button} variant="ghost" colorScheme="primary" leftIcon={<IconMenu boxSize={6} />}>
                    Menu
                  </MenuButton>
                  <MenuList zIndex={400}>
                    <MenuGroup title="Mon compte">
                      <NextLink href="/tableauDeBord/mon-profil">
                        <MenuItem icon={<IconPeople boxSize={5} color="gray.400" />}>Mon Profil</MenuItem>
                      </NextLink>
                      <NextLink href="/tableauDeBord/mes-entreprises">
                        <MenuItem icon={<IconOfficeBuilding boxSize={5} color="gray.400" />}>Mes entreprises</MenuItem>
                      </NextLink>
                      <NextLink href="/tableauDeBord/mes-declarations">
                        <MenuItem icon={<IconEdit boxSize={5} color="gray.400" />}>Mes déclarations</MenuItem>
                      </NextLink>
                      <MenuItem onClick={disconnectUser} icon={<IconLogout boxSize={5} color="gray.400" />}>
                        Déconnexion
                      </MenuItem>
                    </MenuGroup>
                    {staff && (
                      <>
                        <MenuDivider />
                        <MenuGroup title="Administration">
                          <NextLink href="/tableauDeBord/gerer-utilisateurs">
                            <MenuItem icon={<IconUserGroup boxSize={5} color="gray.400" />}>
                              Gérer utilisateurs
                            </MenuItem>
                          </NextLink>
                          <NextLink href="/tableauDeBord/generer-token-utilisateur">
                            <MenuItem icon={<LinkIcon boxSize={5} color="gray.400" />}>Générer token</MenuItem>
                          </NextLink>
                        </MenuGroup>
                      </>
                    )}
                    {isFAQMenuDisplayed && (
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
                  {isDesktop && (
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
                  {isXLScreen && (
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
      {isFAQMenuDisplayed && (
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
