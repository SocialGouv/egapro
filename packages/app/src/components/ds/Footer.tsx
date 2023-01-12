import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Box, Container, Flex, Link, List, ListItem, Text } from "@chakra-ui/react";
import { config } from "@common/config";

import { Logo } from "./Logo";
import { TextLink } from "./TextLink";

export interface FooterProps {
  consultationMode?: boolean;
}

export const Footer = ({ consultationMode }: FooterProps) => {
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
            {!consultationMode && (
              <ListItem>
                <Link href="https://travail-emploi.gouv.fr/IMG/xlsx/referents_egalite_professionnelle.xlsx" isExternal>
                  <Flex justify="center" align="center">
                    Télécharger la liste des référents Egapro (XLSX, 22 Ko) <ExternalLinkIcon ml={2} />
                  </Flex>
                </Link>
              </ListItem>
            )}
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
            Index Egapro et Représentation équilibrée ont été développés par les équipes de la fabrique numérique des
            ministères sociaux.
          </Text>
          {consultationMode ? (
            <Text fontSize="sm" mt={1}>
              Contact : <TextLink to={"mailto:index@travail.gouv.fr"}>index@travail.gouv.fr</TextLink>
            </Text>
          ) : (
            <Text fontSize="sm" mt={1}>
              Pour nous aider à l'améliorer{" "}
              <TextLink to={`https://github.com/SocialGouv/egapro/commit/${config.githubSha}`} isExternal>
                contribuez sur Github
              </TextLink>
            </Text>
          )}
        </Box>
      </Container>
    </Box>
  );
};
