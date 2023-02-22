import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { Box, Button, Container, Flex, HStack, Link, List, ListItem, Text, useColorMode } from "@chakra-ui/react";
import { isOpenFeature } from "@common/utils/feature";
import NextLink from "next/link";

import { Logo } from "./Logo";

export const Header = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Box
      as="header"
      role="banner"
      sx={{
        flexShrink: 0,
        borderBottom: "1px solid #E3E4ED",
      }}
    >
      <Box
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
              <Link href="#main">Aller au contenu</Link>
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
          <Box fontFamily="gabriela">
            <NextLink href="/" passHref>
              <Link fontSize="2xl">Egapro</Link>
            </NextLink>
            <Text fontSize="xs">Index de l’égalité professionnelle et représentation équilibrée</Text>
          </Box>
          {isOpenFeature(process.env.NEXT_PUBLIC_FEATURE_DARK_MODE) && (
            <Box ml="auto">
              <Button aria-label="Changer le mode de couleur" onClick={toggleColorMode}>
                {colorMode === "light" ? <MoonIcon /> : <SunIcon />}
              </Button>
            </Box>
          )}
        </Flex>
      </Container>
    </Box>
  );
};
