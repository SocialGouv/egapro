import React from "react"
import { Link as ReachLink } from "react-router-dom"
import { Box, Container, List, ListItem, Text, Link } from "@chakra-ui/react"
import Logo from "./ds/Logo"
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
              <Link
                href="https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle-discrimination-et-harcelement/indexegapro"
                isExternal
              >
                retrouvez le simulateur au format Excel
              </Link>
            </ListItem>
            <ListItem>
              <Link as={ReachLink} to="/mentions-legales">
                mentions légales
              </Link>
            </ListItem>
            <ListItem>
              <Link as={ReachLink} to="/accessibilite">
                accessibilité&nbsp;: non conforme
              </Link>
            </ListItem>
            <ListItem>
              <Link as={ReachLink} to="/cgu">
                conditions générales d'utilisation
              </Link>
            </ListItem>
            <ListItem>
              <Link as={ReachLink} to="/politique-confidentialite">
                politique de confidentialité
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
            <Link
              sx={{ textDecoration: "underline" }}
              href="https://voxusagers.numerique.gouv.fr/Demarches/2240?&view-mode=formulaire-avis&nd_mode=en-ligne-enti%C3%A8rement&nd_source=button&key=73366ddb13d498f4c77d01c2983bab48"
              isExternal
            >
              donnez-nous votre avis
            </Link>{" "}
            <Link
              sx={{ textDecoration: "underline" }}
              href={`https://github.com/SocialGouv/egapro/tree/${version}`}
              isExternal
            >
              contribuez sur Github
            </Link>
          </Text>
        </Box>
      </Container>
    </Box>
  )
}

export default Footer
