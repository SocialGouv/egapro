import { Box, Container, Link, List, Stack, Text } from "@chakra-ui/react";
import { config } from "@common/config";

import { useGdprStore } from "../../design-system/base/custom/ConsentBanner";
import { Logo } from "./Logo";
import { TextLink } from "./TextLink";

export const Footer = () => {
  const consentModalButtonProps = useGdprStore(state => state.consentModalButtonProps);

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
        a: {
          background: "none !important", // This is a hack to override the global css of dsfr on buttons.
        },
        "a:after": {
          display: "none !important",
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
          ></List>
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
          <Text fontSize="sm" mb="4">
            Index Egapro et Représentation équilibrée sont développés et maintenus par les équipes de la fabrique
            numérique des ministères sociaux.
          </Text>
          <Stack direction={["column", "row"]} mt="1" gap="4">
            <Text fontSize="sm" as="span">
              Contact:&nbsp;
              <TextLink to={"mailto:index@travail.gouv.fr"} isExternal>
                index@travail.gouv.fr
              </TextLink>
            </Text>
            <Text fontSize="sm" as="span">
              <TextLink to={`https://github.com/SocialGouv/egapro/commit/${config.githubSha}`} isExternal>
                Contribuer sur GitHub
              </TextLink>
            </Text>
            <Text
              fontSize="sm"
              as="span"
              textDecoration="underline"
              color="inherit"
              cursor="pointer"
              {...consentModalButtonProps.nativeButtonProps}
              onClick={consentModalButtonProps.onClick}
            >
              Gestion des cookies
            </Text>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};
