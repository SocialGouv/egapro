import React from "react"
import { Link as ReachLink } from "react-router-dom"
import { Box, Container, Link, Flex, Text, ListItem, List, HStack } from "@chakra-ui/react"
import { MenuProfile } from "./ds/MenuProfile"
import Logo from "./ds/Logo"

function Header() {
  return (
    <Box
      as="header"
      role="banner"
      bg="white"
      sx={{
        flexShrink: 0,
        borderBottom: "1px solid #E3E4ED",
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
        <Container as="nav" maxW="container.xl">
          <HStack as={List} spacing={4}>
            <ListItem>
              <Link href="#navigation">Aller au menu</Link>
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
      <Container maxW="container.xl" id="navigation">
        <Flex align="center" py={6}>
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
          <Box
            sx={{
              fontFamily: "'Gabriela', serif",
            }}
          >
            <Link as={ReachLink} to="/" fontSize="2xl">
              Index Egapro
            </Link>
            <Text fontSize="xs">
              L’outil de calcul et de déclaration de votre index égalité professionnelle Femmes-Hommes
            </Text>
          </Box>
          <Box ml="auto">
            <MenuProfile />
          </Box>
        </Flex>
      </Container>
    </Box>
  )
}

export default Header
