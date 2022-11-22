import React from "react"
import { Link as ReachLink } from "react-router-dom"
import { Box, Container, List, ListItem, Text, Link } from "@chakra-ui/react"

import Logo from "./ds/Logo"
import TextLink from "./ds/TextLink"
import packageConfig from "../../package.json"

function Footer() {
  const version = process.env.REACT_APP_VERSION || packageConfig.version

  return (
    <Box
      id="footer"
      as="footer"
      role="contentinfo"
      py={6}
      sx={{
        borderTop: "1px solid #E3E4ED",
        "@media print": {
          display: "none",
        },
      }}
    >
      <Container
        maxW="container.xl"
        sx={{
          "@media (min-width: 1024px)": {
            display: "flex",
            flexDirection: "row",
          },
        }}
      >
        <Box
          sx={{
            "@media (min-width: 640px)": {
              display: "flex",
              flexDirection: "row",
            },
          }}
        >
          <Box pr={8}>
            <Link href="https://travail-emploi.gouv.fr/" isExternal pt={2} sx={{ display: "block" }}>
              <Logo />
            </Link>
          </Box>

          <List
            fontSize="sm"
            sx={{
              "@media (max-width: 639px)": {
                marginTop: "var(--chakra-space-4)",
              },
            }}
          >
            <ListItem>
              <Link href="https://travail-emploi.gouv.fr/IMG/xlsx/referents_egalite_professionnelle.xlsx" isExternal>
                Télécharger la liste des référents Egapro (XLSX, 22 Ko)
              </Link>
            </ListItem>
            <ListItem>
              <Link as={ReachLink} to="/mentions-legales">
                Mentions légales
              </Link>
            </ListItem>
            <ListItem>
              <Link href={process.env.PUBLIC_URL + "/a11y/declaration-accessibilite-rgaa-4-1.pdf"}>
                Accessibilité&nbsp;: partiellement conforme
              </Link>
            </ListItem>
            <ListItem>
              <Link as={ReachLink} to="/cgu">
                Conditions générales d'utilisation
              </Link>
            </ListItem>
            <ListItem>
              <Link as={ReachLink} to="/politique-confidentialite">
                Politique de confidentialité
              </Link>
            </ListItem>
          </List>
        </Box>

        <Box
          sx={{
            "@media (max-width: 1023px)": {
              marginTop: "var(--chakra-space-4)",
            },
            "@media (min-width: 1024px)": {
              marginLeft: "auto",
            },
          }}
        >
          <Text fontSize="sm" as="i">
            Index Egapro a été développé par les équipes de la fabrique numérique des ministères sociaux
          </Text>
          <Text fontSize="sm" mt={1}>
            Pour nous aider à l'améliorer{" "}
            <TextLink to={`https://github.com/SocialGouv/egapro/tree/${version}`} isExternal>
              contribuez sur Github
            </TextLink>
          </Text>
        </Box>
      </Container>
    </Box>
  )
}

export default Footer
