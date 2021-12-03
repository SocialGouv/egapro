import React from "react"
import { Link as ReachLink } from "react-router-dom"
import { Box, Container, Link, Flex, Text } from "@chakra-ui/react"
import { MenuProfile } from "./ds/MenuProfile"
import Logo from "./ds/Logo"

function Header() {
  return (
    <Box
      py={6}
      as="header"
      role="banner"
      bg="white"
      sx={{
        flexShrink: 0,
        borderBottom: "1px solid #E3E4ED",
      }}
    >
      <Container maxW="container.xl">
        <Flex align="center">
          <Box pr={6}>
            <Link href="https://travail-emploi.gouv.fr/" isExternal>
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
