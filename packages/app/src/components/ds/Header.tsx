import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  ButtonGroup,
  Container,
  Flex,
  HStack,
  Link,
  List,
  ListItem,
  Spacer,
  Text,
  useColorMode,
  useMediaQuery,
} from "@chakra-ui/react";
import { isOpenFeature } from "@common/utils/feature";
import NextLink from "next/link";
import React, { useEffect, useState } from "react";

import { ButtonLink } from "./ButtonLink";
import { IconPeopleCircle } from "./Icons";
import { Logo } from "./Logo";

export const Header: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isSmallerThan639] = useMediaQuery("(max-width: 639px)");

  useEffect(() => {
    if (isSmallerThan639 !== isMobile) {
      setIsMobile(isSmallerThan639);
    }
  }, [isMobile, isSmallerThan639]);

  const [isFAQMenuDisplayed, setIsFAQMenuDisplayed] = useState<boolean>(false);
  const [isSmallerThan1280] = useMediaQuery("(max-width: 1279px)");

  useEffect(() => {
    if (isSmallerThan1280 !== isFAQMenuDisplayed) {
      setIsFAQMenuDisplayed(isSmallerThan1280);
    }
  }, [isFAQMenuDisplayed, isSmallerThan1280]);

  const [isXLScreen, setIsXLScreen] = useState<boolean>(false);
  const [isLargerThan1280] = useMediaQuery("(min-width: 1280px)");

  useEffect(() => {
    if (isLargerThan1280 !== isXLScreen) {
      setIsXLScreen(isLargerThan1280);
    }
  }, [isXLScreen, isLargerThan1280]);

  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const [isBiggerThanMobileAndSmallerThan1280] = useMediaQuery("(min-width: 640px) and (max-width: 1279px)");

  useEffect(() => {
    if (isBiggerThanMobileAndSmallerThan1280 !== isDesktop) {
      setIsDesktop(isBiggerThanMobileAndSmallerThan1280);
    }
  }, [isDesktop, isBiggerThanMobileAndSmallerThan1280]);
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
          <Flex direction="row" align="center">
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
                <Link fontSize="2xl">Index Egapro</Link>
              </NextLink>
              <Text fontSize="xs">
                L'outil de calcul et de déclaration de votre index égalité professionnelle Femmes-Hommes
              </Text>
            </Box>
            {isOpenFeature(process.env.NEXT_PUBLIC_FEATURE_DARK_MODE) && (
              <Box ml="auto">
                <Button aria-label="Changer le mode de couleur" onClick={toggleColorMode}>
                  {colorMode === "light" ? <MoonIcon /> : <SunIcon />}
                </Button>
              </Box>
            )}
          </Flex>
          <Spacer />
          <Box>
            <ButtonGroup gap="0">
              {isMobile && (
                <ButtonLink to="/mon-espace/me-connecter" label={"Me connecter"} size="xs" variant="ghost" />
              )}
              {isDesktop && (
                <ButtonLink
                  to="/mon-espace/me-connecter"
                  label={"Me connecter"}
                  leftIcon={<IconPeopleCircle />}
                  variant="ghost"
                />
              )}
              {isXLScreen && (
                <ButtonLink
                  to="/mon-espace/me-connecter"
                  label={"Me connecter"}
                  leftIcon={<IconPeopleCircle />}
                  variant="ghost"
                />
              )}
            </ButtonGroup>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
};
