import React from "react"
import { Link as ReachLink } from "react-router-dom"
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
  Button,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerBody,
  useMediaQuery,
} from "@chakra-ui/react"

import MenuProfile from "./ds/MenuProfile"
import Logo from "./ds/Logo"
import FAQ from "../views/FAQ"

function Header() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const btnRef = React.useRef()
  const [isSmallerThan1280] = useMediaQuery("(max-width: 1279px)")
  return (
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
          <Box pr={6}>
            <Link
              href="https://travail-emploi.gouv.fr/"
              isExternal
              sx={{
                display: "block",
              }}
            >
              <Logo />
            </Link>
          </Box>
          <Box fontFamily="custom">
            <Link as={ReachLink} to="/" fontSize="2xl" color="gray.900">
              Index Egapro
            </Link>
            <Text fontSize="xs">
              L’outil de calcul et de déclaration de votre index égalité professionnelle Femmes-Hommes
            </Text>
          </Box>
          <HStack ml="auto" spacing={2}>
            {isSmallerThan1280 && (
              <>
                {/* @ts-ignore */}
                <Button ref={btnRef} colorScheme="primary" variant="ghost" onClick={onOpen}>
                  Aide
                </Button>
                {/* @ts-ignore */}
                <Drawer isOpen={isOpen} placement="right" onClose={onClose} finalFocusRef={btnRef} size="md">
                  <DrawerOverlay />
                  <DrawerContent>
                    <DrawerBody p={0}>
                      <FAQ />
                    </DrawerBody>
                  </DrawerContent>
                </Drawer>
              </>
            )}

            <MenuProfile />
          </HStack>
        </Flex>
      </Container>
    </Box>
  )
}

export default Header
