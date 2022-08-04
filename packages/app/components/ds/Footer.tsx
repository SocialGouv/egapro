import React from "react"
// import NextLink from "next/link"
import { Box, Container, List, ListItem, Text, Link, Flex } from "@chakra-ui/react"

import Logo from "@/components/ds/Logo"
import TextLink from "@/components/ds/TextLink"
import packageConfig from "../../package.json"
import { ExternalLinkIcon } from "@chakra-ui/icons"

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
                <Flex justify="center" align="center">
                  Télécharger la liste des référents Egapro (XLSX, 22 Ko) <ExternalLinkIcon ml={2} />
                </Flex>
              </Link>
            </ListItem>
            {/* <ListItem>
              <NextLink href="/mentions-legales">
                <Link>Mentions légales</Link>
              </NextLink>
            </ListItem>
            <ListItem>
              <Link href={process.env.PUBLIC_URL + "/a11y/declaration-accessibilite-rgaa-4-1.pdf"}>
                Accessibilité&nbsp;: partiellement conforme
              </Link>
            </ListItem>
            <ListItem>
              <NextLink href="/cgu">
                <Link>Conditions générales d'utilisation</Link>
              </NextLink>
            </ListItem>
            <ListItem>
              <NextLink href="/politique-confidentialite">
                <Link>Politique de confidentialité</Link>
              </NextLink>
            </ListItem> */}
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
            <TextLink
              to="https://voxusagers.numerique.gouv.fr/Demarches/2240?&view-mode=formulaire-avis&nd_mode=en-ligne-enti%C3%A8rement&nd_source=button&key=73366ddb13d498f4c77d01c2983bab48"
              isExternal
            >
              donnez-nous votre avis
            </TextLink>
            {", "}
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
